
using background_job_worker.DTOs;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace background_job_worker.Jobs
{
    public class EmailBackgroundJobs : IEmailBackgroundJobs
    {
        private readonly IConfiguration _config;

        public EmailBackgroundJobs(IConfiguration config)
        {
            _config = config;
        }

        public async Task<ReturnResult<bool>> SendAsync(string toEmail, string subject, string htmlBody)
        {
            var result = new ReturnResult<bool>();

            try
            {
                // load SMTP config from appsettings
                var smtpConfig = _config.GetSection("SmtpSettings").Get<SMTPSettingDTO>();

                if (smtpConfig == null)
                {
                    result.Message = "The email service is currently unavailable. Please try again later.";
                    Console.WriteLine("SMTP configuration missing in appsettings.");
                    return result;
                }

                var message = new MimeMessage();
                message.From.Add(MailboxAddress.Parse(smtpConfig.From));
                message.To.Add(MailboxAddress.Parse(toEmail));
                message.Subject = subject;
                message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

                using var client = new SmtpClient();

                try
                {
                    var host = smtpConfig.Host;
                    var port = smtpConfig.Port != 0 ? smtpConfig.Port : 587;
                    var user = smtpConfig.Username;
                    var pass = smtpConfig.Password;

                    SecureSocketOptions socketOptions =
                        port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

                    await client.ConnectAsync(host, port, socketOptions);

                    if (!string.IsNullOrEmpty(user))
                        await client.AuthenticateAsync(user, pass);

                    await client.SendAsync(message);
                    result.Result = true;
                }
                catch (SmtpCommandException ex)
                {
                    result.Message = "Unable to send the email at the moment. Please verify your email address or try again later.";
                    Console.WriteLine(ex.Message);
                    return result;
                }
                catch (HttpProtocolException ex)
                {
                    result.Message = "There was a temporary issue with the email service. Please try again shortly.";
                    Console.WriteLine(ex.Message);
                    return result;
                }
                catch (Exception ex)
                {
                    result.Message = "An unexpected error occurred while sending the email. Please try again.";
                    Console.WriteLine(ex.Message);
                    return result;
                }
                finally
                {
                    try
                    {
                        if (client.IsConnected)
                            await client.DisconnectAsync(true);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Failed to disconnect SMTP client: " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                result.Message = "An unexpected error occurred. Please try again.";
                Console.WriteLine(ex.Message);
            }

            return result;
        }
    }
}