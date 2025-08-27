using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Src.Database;
using System;
using System.Threading.Tasks;

namespace Src.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DatabaseController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("reset")]
        public async Task<ActionResult> ResetDatabase()
        {
            try
            {
                // Get table names in the correct deletion order
                var tablesToDelete = DatabaseConstants.GetTableDeletionOrder();

                // Delete all data from tables in the correct order to avoid foreign key constraints
                foreach (var tableName in tablesToDelete)
                {
                    await _context.Database.ExecuteSqlRawAsync($"DELETE FROM {tableName}");
                }

                return Ok(new { message = "Database has been reset successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to reset database: {ex.Message}" });
            }
        }

        [HttpGet("status")]
        public async Task<ActionResult> GetDatabaseStatus()
        {
            try
            {
                var userCount = await _context.Users.CountAsync();
                var accountCount = await _context.Accounts.CountAsync();
                var transactionCount = await _context.Transactions.CountAsync();
                var coreDetailsCount = await _context.CoreDetailsComponents.CountAsync();
                var activeAccountCount = await _context.ActiveAccountComponents.CountAsync();
                var spendingLimitCount = await _context.SpendingLimitComponents.CountAsync();
                var savingGoalCount = await _context.SavingGoalComponents.CountAsync();

                return Ok(new
                {
                    users = userCount,
                    accounts = accountCount,
                    transactions = transactionCount,
                    components = new
                    {
                        coreDetails = coreDetailsCount,
                        activeAccounts = activeAccountCount,
                        spendingLimits = spendingLimitCount,
                        savingGoals = savingGoalCount
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to get database status: {ex.Message}" });
            }
        }
    }
}
