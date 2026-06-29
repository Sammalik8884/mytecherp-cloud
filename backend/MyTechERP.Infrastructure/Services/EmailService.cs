using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MytechERP.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true)
        {
            var email = new MimeMessage();

            var senderName = !string.IsNullOrWhiteSpace(_config["EmailSettings:SenderName"]) ? _config["EmailSettings:SenderName"] : "MyTech ERP System";
            var senderEmail = !string.IsNullOrWhiteSpace(_config["EmailSettings:SenderEmail"]) ? _config["EmailSettings:SenderEmail"] : "mytechfms@gmail.com";
            email.From.Add(new MailboxAddress(senderName, senderEmail));
            email.To.Add(MailboxAddress.Parse(toEmail ?? string.Empty));
            email.Subject = subject;

            var builder = new BodyBuilder();
            if (isHtml) 
            {
                builder.HtmlBody = body;
                // Provide plain text fallback for clients that disable HTML
                builder.TextBody = System.Text.RegularExpressions.Regex.Replace(body, "<.*?>", string.Empty);
            }
            else 
            {
                builder.TextBody = body;
            }

            email.Body = builder.ToMessageBody();

            await SendAsync(email);
        }

        public async Task SendEmailWithAttachmentAsync(string toEmail, string subject, string body, byte[] attachment, string fileName)
        {
            var email = new MimeMessage();

            var senderName = !string.IsNullOrWhiteSpace(_config["EmailSettings:SenderName"]) ? _config["EmailSettings:SenderName"] : "MyTech ERP System";
            var senderEmail = !string.IsNullOrWhiteSpace(_config["EmailSettings:SenderEmail"]) ? _config["EmailSettings:SenderEmail"] : "mytechfms@gmail.com";
            email.From.Add(new MailboxAddress(senderName, senderEmail));
            email.To.Add(MailboxAddress.Parse(toEmail ?? string.Empty));
            email.Subject = subject;

            var builder = new BodyBuilder();
            builder.HtmlBody = body;
            // Provide plain text fallback for clients that disable HTML
            builder.TextBody = System.Text.RegularExpressions.Regex.Replace(body, "<.*?>", string.Empty);

            if (attachment != null && attachment.Length > 0)
            {
                builder.Attachments.Add(fileName, attachment);
            }

            email.Body = builder.ToMessageBody();

            await SendAsync(email);
        }

        private async Task SendAsync(MimeMessage email)
        {
            using var smtp = new SmtpClient();
            try
            {
                var server = !string.IsNullOrWhiteSpace(_config["EmailSettings:Server"]) ? _config["EmailSettings:Server"] : "smtp.gmail.com";
                if (!int.TryParse(_config["EmailSettings:Port"], out int port)) port = 587;

                var useSslStr = _config["EmailSettings:EnableSsl"];
                var useSsl = string.IsNullOrWhiteSpace(useSslStr) ? true : bool.Parse(useSslStr);
                
                var password = !string.IsNullOrWhiteSpace(_config["EmailSettings:Password"]) ? _config["EmailSettings:Password"] : "mqbwygejgvhsrjfn";
                var emailFrom = !string.IsNullOrWhiteSpace(_config["EmailSettings:SenderEmail"]) ? _config["EmailSettings:SenderEmail"] : "mytechfms@gmail.com";

                await smtp.ConnectAsync(server, port, useSsl ? MailKit.Security.SecureSocketOptions.StartTls : MailKit.Security.SecureSocketOptions.Auto);
                await smtp.AuthenticateAsync(emailFrom, password);
                await smtp.SendAsync(email);
            }
            finally
            {
                await smtp.DisconnectAsync(true);
            }
        }
    }
}

