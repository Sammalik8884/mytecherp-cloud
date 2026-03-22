using MytechERP.Application.DTOs.Inventory;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Interfaces;
using MytechERP.domain.Inventory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static MytechERP.domain.Inventory.PurchaseOrder;

namespace MyTechERP.Infrastructure.Services
{
    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepository _poRepo;
        private readonly IInventoryService _inventoryService; 
        private readonly IEmailService _emailService;
        private readonly IPdfService _pdfService;
        private readonly ICurrentUserService _currentUserService;

        public PurchaseOrderService(
            IPurchaseOrderRepository poRepo, 
            ICurrentUserService currentUserService,
            IInventoryService inventoryService,
            IEmailService emailService,
            IPdfService pdfService)
        {
            _poRepo = poRepo;
            _currentUserService = currentUserService;
            _inventoryService = inventoryService;
            _emailService = emailService;
            _pdfService = pdfService;
        }

        public async Task<List<Vendor>> GetAllVendorsAsync()
        {
            return await _poRepo.GetAllVendorsAsync();
        }

        public async Task<List<PurchaseOrderDto>> GetAllPOsAsync()
        {
            var pos = await _poRepo.GetAllPOsAsync();
            
            // Get current tenant ID safely
            var tenantId = pos.FirstOrDefault()?.TenantId ?? 0;
            var vendorNames = tenantId > 0
                ? await _poRepo.GetVendorNamesByTenantAsync(tenantId)
                : new Dictionary<int, string>();
            
            var result = new List<PurchaseOrderDto>();
            foreach (var p in pos)
            {
                vendorNames.TryGetValue(p.VendorId, out var vendorName);
                var dto = new PurchaseOrderDto
                {
                    Id = p.Id,
                    PONumber = p.PONumber,
                    VendorId = p.VendorId,
                    VendorName = vendorName ?? "Unknown Vendor",
                    TargetWarehouseId = p.TargetWarehouseId,
                    OrderDate = p.OrderDate,
                    ExpectedDeliveryDate = p.ExpectedDeliveryDate ?? p.OrderDate.AddDays(7),
                    TotalAmount = p.TotalAmount,
                    Status = (int)p.Status,
                    Items = new List<PurchaseOrderItemDto>()
                };

                if (p.Items != null)
                {
                    foreach (var i in p.Items)
                    {
                        dto.Items.Add(new PurchaseOrderItemDto
                        {
                            Id = i.Id,
                            ProductId = i.ProductId,
                            ProductName = i.Product?.Name ?? "Unknown Product",
                            QuantityOrdered = i.QuantityOrdered,
                            QuantityReceived = i.QuantityReceived,
                            UnitCost = i.UnitCost
                        });
                    }
                }
                result.Add(dto);
            }

            return result;
        }

        public async Task<Vendor> CreateVendorAsync(CreateVendorDto dto)
        {
            var vendor = new Vendor
            {
                Name = dto.Name,
                ContactPerson = dto.ContactPerson,
                Email = dto.Email,
                Phone = dto.Phone
            };
            return await _poRepo.CreateVendorAsync(vendor);
        }

        public async Task<Vendor> UpdateVendorAsync(int id, UpdateVendorDto dto)
        {
            var vendor = await _poRepo.GetVendorByIdAsync(id);
            if (vendor == null) throw new Exception("Vendor not found.");

            vendor.Name = dto.Name;
            vendor.ContactPerson = dto.ContactPerson;
            vendor.Email = dto.Email;
            vendor.Phone = dto.Phone;

            await _poRepo.UpdateVendorAsync(vendor);
            return vendor;
        }

        public async Task DeleteVendorAsync(int id)
        {
            var vendor = await _poRepo.GetVendorByIdAsync(id);
            if (vendor == null) throw new Exception("Vendor not found.");

            vendor.IsDeleted = true;
            await _poRepo.UpdateVendorAsync(vendor);
        }

        public async Task<PurchaseOrder> CreatePOAsync(CreatePODto dto)
        {
            var po = new PurchaseOrder
            {
                VendorId = dto.VendorId,
                TargetWarehouseId = dto.TargetWarehouseId,
                PONumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                OrderDate = DateTime.UtcNow,
                ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
                Status = POStatus.Draft
            };

            foreach (var itemDto in dto.Items)
            {
                var item = new PurchaseOrderItem
                {
                    ProductId = itemDto.ProductId,
                    QuantityOrdered = itemDto.Quantity,
                    UnitCost = itemDto.UnitCost
                };
                po.Items.Add(item);
                po.TotalAmount += (item.QuantityOrdered * item.UnitCost);
            }

            return await _poRepo.CreatePOAsync(po);
        }

        public async Task<PurchaseOrder> UpdatePOAsync(int id, UpdatePODto dto)
        {
            var po = await _poRepo.GetPOByIdAsync(id);
            if (po == null) throw new Exception("Purchase Order not found.");

            if (po.Status != POStatus.Draft)
            {
                throw new Exception("Only Draft Purchase Orders can be updated.");
            }

            po.VendorId = dto.VendorId;
            po.TargetWarehouseId = dto.TargetWarehouseId;
            po.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;

            // Simple replace items for update:
            po.Items.Clear();
            po.TotalAmount = 0;

            foreach (var itemDto in dto.Items)
            {
                var item = new PurchaseOrderItem
                {
                    ProductId = itemDto.ProductId,
                    QuantityOrdered = itemDto.Quantity,
                    UnitCost = itemDto.UnitCost
                };
                po.Items.Add(item);
                po.TotalAmount += (item.QuantityOrdered * item.UnitCost);
            }

            await _poRepo.UpdatePOAsync(po);
            return po;
        }

        public async Task DeletePOAsync(int id)
        {
            var po = await _poRepo.GetPOByIdAsync(id);
            if (po == null) throw new Exception("Purchase Order not found.");
            
            if (po.Status == POStatus.Received)
            {
                throw new Exception("Cannot delete a Purchase Order that has already been received.");
            }

            await _poRepo.DeletePOAsync(id);
        }

        public async Task ReceivePOAsync(int poId)
        {
            var po = await _poRepo.GetPOByIdAsync(poId);
            if (po == null) throw new Exception("Purchase Order not found");

            if (po.Status == POStatus.Received) throw new Exception("This PO is already received.");

            foreach (var item in po.Items)
            {
                await _inventoryService.AddStockAsync(new StockMovementDto
                {
                    ProductId = item.ProductId,
                    WarehouseId = po.TargetWarehouseId,
                    Quantity = item.QuantityOrdered,
                    Reason = $"PO Received: {po.PONumber}"
                });

                item.QuantityReceived = item.QuantityOrdered;
            }

            po.Status = POStatus.Received;
            await _poRepo.UpdatePOAsync(po);
        }

        public async Task SendPOToVendorAsync(int poId)
        {
            var po = await _poRepo.GetPOByIdAsync(poId);
            if (po == null) throw new Exception("Purchase Order not found.");
            
            if (po.Vendor == null || string.IsNullOrEmpty(po.Vendor.Email))
            {
                throw new Exception("Vendor email address is missing. Cannot send PO.");
            }

            // Generate the PDF
            var pdfBytes = await _pdfService.GeneratePurchaseOrderPdfAsync(poId);

            // Construct Email
            string subject = $"Purchase Order #{po.PONumber} from MY TECH ENGINEERING";
            string body = $@"
                <div style='font-family: Arial, sans-serif;'>
                    <h2>Purchase Order #{po.PONumber}</h2>
                    <p>Dear {po.Vendor.ContactPerson ?? po.Vendor.Name},</p>
                    <p>Please find attached our official Purchase Order #{po.PONumber}.</p>
                    <p>If you have any questions or concerns regarding this order, please reply to this email.</p>
                    <br/>
                    <p>Thank you,</p>
                    <p><strong>MY TECH ENGINEERING COMPANY PVT LTD</strong></p>
                </div>
            ";

            // Send Email with PDF Attachment
            await _emailService.SendEmailWithAttachmentAsync(
                toEmail: po.Vendor.Email,
                subject: subject,
                body: body,
                attachment: pdfBytes,
                fileName: $"PO-{po.PONumber}.pdf"
            );

            // Update Status to Sent if it's currently Draft
            if (po.Status == POStatus.Draft)
            {
                po.Status = POStatus.Sent;
                await _poRepo.UpdatePOAsync(po);
            }
        }

        public async Task MarkAsSentAsync(int poId)
        {
            var po = await _poRepo.GetPOByIdAsync(poId);
            if (po == null) throw new Exception("Purchase Order not found");

            if (po.Status != POStatus.Draft) throw new Exception("Only Draft POs can be marked as Sent.");

            po.Status = POStatus.Sent;
            await _poRepo.UpdatePOAsync(po);
        }
    }
}

