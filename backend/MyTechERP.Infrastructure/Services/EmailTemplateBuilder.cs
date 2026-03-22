using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class EmailTemplateBuilder
    {
        public static string BuildReviewRequiredTemplate(string quoteNumber, string creatorName, decimal amount)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;'>
                    <h2 style='color: #d35400;'> Action Required: Quotation Approval</h2>
                    <p>Hello Manager,</p>
                    <p>A new quotation requires your review.</p>
                    <ul>
                        <li><strong>Quote #:</strong> {quoteNumber}</li>
                        <li><strong>Created By:</strong> {creatorName}</li>
                        <li><strong>Amount:</strong> {amount:N2}</li>
                    </ul>
                    <p>Please log in to the ERP to approve or reject this quote.</p>
                    <hr />
                    <small>MyTech ERP Notification System</small>
                </div>";
        }

        public static string BuildApprovedTemplate(string customerName, string quoteNumber, string total)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;'>
                    <h2 style='color: #27ae60;'> Quotation Approved</h2>
                    <p>Dear {customerName},</p>
                    <p>We are pleased to inform you that Quotation <strong>#{quoteNumber}</strong> has been officially approved.</p>
                    <p><strong>Total Amount:</strong> {total}</p>
                    <p>Our team will contact you shortly regarding the next steps.</p>
                    <br/>
                    <p>Thank you,<br/>MyTech Engineering</p>
                </div>";
        }
    }
}

