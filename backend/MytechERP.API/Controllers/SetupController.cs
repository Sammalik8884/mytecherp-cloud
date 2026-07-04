using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MytechERP.Infrastructure.Persistance;

namespace MytechERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SetupController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public SetupController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("run-sql")]
        public async Task<IActionResult> RunSql()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Region' AND Object_ID = Object_ID(N'AspNetUsers'))
                    BEGIN
                        ALTER TABLE AspNetUsers ADD Region NVARCHAR(256) NULL;
                    END

                    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemRegions]') AND type in (N'U'))
                    BEGIN
                        CREATE TABLE SystemRegions (
                            Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                            Name NVARCHAR(256) NOT NULL
                        );
                        INSERT INTO SystemRegions (Name) VALUES ('Karachi'), ('Lahore'), ('Islamabad');
                    END
                ");
                return Ok("Done!");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.ToString());
            }
        }
    }
}
