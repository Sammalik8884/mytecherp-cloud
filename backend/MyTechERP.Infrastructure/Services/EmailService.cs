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

            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            email.From.Add(new MailboxAddress(senderName, senderEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder();
            if (isHtml) builder.HtmlBody = body;
            else builder.TextBody = body;

            email.Body = builder.ToMessageBody();

            await SendAsync(email);
        }

        public async Task SendEmailWithAttachmentAsync(string toEmail, string subject, string body, byte[] attachment, string fileName)
        {
            var email = new MimeMessage();

            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            email.From.Add(new MailboxAddress(senderName, senderEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder();
            builder.HtmlBody = body;

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
                var server = _config["EmailSettings:Server"];
                if (!int.TryParse(_config["EmailSettings:Port"], out int port)) port = 587;

                var useSsl = bool.Parse(_config["EmailSettings:EnableSsl"]);
                var password = _config["EmailSettings:Password"];
                var emailFrom = _config["EmailSettings:SenderEmail"];

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

