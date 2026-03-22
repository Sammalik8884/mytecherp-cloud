using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace MytechERP.API.Middleware
{
    public class GlobalExceptionHandler :IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;
       public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }
        public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Exception Occured:{Message}", exception.Message);
            
            // Default to 500, but if the controller already set a failure code, keep it
            var statusCode = context.Response.StatusCode == StatusCodes.Status200OK 
                             ? StatusCodes.Status500InternalServerError 
                             : context.Response.StatusCode;

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = "Server Error",
                Detail = "An Internal error occured. Please contact support. Error: " + exception.Message

            };
            
            context.Response.StatusCode = statusCode;
            await context.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
            return true;
        
        }
    }

}
