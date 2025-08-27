using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Src.Entities;
using Src.Components;
using Src.Shared.Controller;
using Src.Shared.DTO;
using Src.Shared.Repository;
using Src.Database;
using Src.Repositories;

namespace Src.Controllers
{
    public class AccountReadDTO
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public bool IsMain { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        
        // Component data
        public CoreDetailsReadDTO? CoreDetails { get; set; }
        public ActiveAccountReadDTO? ActiveAccount { get; set; }
        public SpendingLimitReadDTO? SpendingLimit { get; set; }
        public SavingGoalReadDTO? SavingGoal { get; set; }
    }

    public class CoreDetailsReadDTO
    {
        public string Name { get; set; } = string.Empty;
        public decimal Balance { get; set; }
    }

    public class ActiveAccountReadDTO
    {
        public string IBAN { get; set; } = string.Empty;
        public DateTime ActivatedAt { get; set; }
    }

    public class SpendingLimitReadDTO
    {
        public decimal LimitAmount { get; set; }
        public LimitTimeframe Timeframe { get; set; }
        public decimal CurrentSpending { get; set; }
        public DateTime PeriodStartDate { get; set; }
    }

    public class SavingGoalReadDTO
    {
        public string GoalName { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
    }

    public class AccountCreateDTO
    {
        [Required]
        public Guid UserId { get; set; }
        
        public bool IsMain { get; set; }

        // Required core details
        [Required]
        public CoreDetailsCreateDTO CoreDetails { get; set; } = new();

        // Optional components
        public ActiveAccountCreateDTO? ActiveAccount { get; set; }
        public SpendingLimitCreateDTO? SpendingLimit { get; set; }
        public SavingGoalCreateDTO? SavingGoal { get; set; }
    }

    public class CoreDetailsCreateDTO
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public decimal Balance { get; set; }
    }

    public class ActiveAccountCreateDTO
    {
        [Required]
        [MaxLength(34)]
        public string IBAN { get; set; } = string.Empty;
    }

    public class SpendingLimitCreateDTO
    {
        [Required]
        public decimal LimitAmount { get; set; }

        [Required]
        public LimitTimeframe Timeframe { get; set; }

        public decimal CurrentSpending { get; set; } = 0;

        public DateTime? PeriodStartDate { get; set; }
    }

    public class SavingGoalCreateDTO
    {
        [Required]
        [MaxLength(200)]
        public string GoalName { get; set; } = string.Empty;

        [Required]
        public decimal TargetAmount { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : AppController<Account, AccountReadDTO>
    {
        private readonly AppDbContext _context;

        public AccountController(IRepository<Account, AccountReadDTO> repository, AppDbContext context) : base(repository)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAccounts([FromQuery] PaginateDTO paginate)
        {
            return GetEntities(paginate);
        }

        [HttpGet("{id}")]
        public ActionResult<AccountReadDTO> GetAccount(Guid id)
        {
            return FindEntity(a => a.Id == id);
        }

        [HttpGet("user/{userId}")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAccountsByUser(Guid userId, [FromQuery] PaginateDTO paginate)
        {
            return FindEntities(paginate, a => a.UserId == userId);
        }

        // Admin endpoints that show all accounts including deleted ones
        [HttpGet("admin/all")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAllAccounts([FromQuery] PaginateDTO paginate)
        {
            var accountRepository = _repository as AccountRepository;
            if (accountRepository != null)
            {
                var accounts = accountRepository.GetAll(out int total)
                    .Skip(paginate.Skip)
                    .Take(paginate.Limit)
                    .ToList();

                var data = accounts.Select(accountRepository.ParseToRead);
                return Ok(new ListReadDTO<AccountReadDTO>
                {
                    Data = data,
                    Total = total,
                });
            }
            return GetEntities(paginate);
        }

        [HttpGet("admin/{id}")]
        public ActionResult<AccountReadDTO> GetAccountAdmin(Guid id)
        {
            var accountRepository = _repository as AccountRepository;
            if (accountRepository != null)
            {
                var account = accountRepository.FindAll(a => a.Id == id);
                if (account == null) return NotFound();
                return Ok(accountRepository.ParseToRead(account));
            }
            return FindEntity(a => a.Id == id);
        }

        [HttpGet("admin/user/{userId}")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAllAccountsByUser(Guid userId, [FromQuery] PaginateDTO paginate)
        {
            var accountRepository = _repository as AccountRepository;
            if (accountRepository != null)
            {
                var accounts = accountRepository.FindAll(a => a.UserId == userId, out int total)
                    .Skip(paginate.Skip)
                    .Take(paginate.Limit)
                    .ToList();

                var data = accounts.Select(accountRepository.ParseToRead);
                return Ok(new ListReadDTO<AccountReadDTO>
                {
                    Data = data,
                    Total = total,
                });
            }
            return FindEntities(paginate, a => a.UserId == userId);
        }

        [HttpPost]
        public ActionResult<AccountReadDTO> CreateAccount([FromBody] AccountCreateDTO createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Prevent creating multiple main accounts for the same user
            if (createDto.IsMain)
            {
                var existingMainAccount = _repository.Find(a => a.UserId == createDto.UserId && a.IsMain);
                if (existingMainAccount != null)
                {
                    return BadRequest(new { error = "User already has a main account. Only one main account is allowed per user." });
                }
            }

            var account = new Account
            {
                Id = Guid.NewGuid(),
                UserId = createDto.UserId,
                IsMain = createDto.IsMain,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            // Create required CoreDetails component
            account.CoreDetails = new CoreDetailsComponent
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                Name = createDto.CoreDetails.Name,
                Balance = createDto.CoreDetails.Balance,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            // Create optional components
            if (createDto.ActiveAccount != null)
            {
                account.ActiveAccount = new ActiveAccountComponent
                {
                    AccountId = account.Id,
                    IBAN = createDto.ActiveAccount.IBAN,
                    ActivatedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };
            }

            if (createDto.SpendingLimit != null)
            {
                account.SpendingLimit = new SpendingLimitComponent
                {
                    AccountId = account.Id,
                    LimitAmount = createDto.SpendingLimit.LimitAmount,
                    Timeframe = createDto.SpendingLimit.Timeframe,
                    CurrentSpending = createDto.SpendingLimit.CurrentSpending,
                    PeriodStartDate = createDto.SpendingLimit.PeriodStartDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }

            if (createDto.SavingGoal != null)
            {
                account.SavingGoal = new SavingGoalComponent
                {
                    AccountId = account.Id,
                    GoalName = createDto.SavingGoal.GoalName,
                    TargetAmount = createDto.SavingGoal.TargetAmount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }

            return CreateEntity(account);
        }

        [HttpPut("{id}")]
        public ActionResult<AccountReadDTO> UpdateAccount(Guid id, [FromBody] AccountCreateDTO updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if the account exists
            var account = _repository.Find(a => a.Id == id);
            if (account == null)
            {
                return NotFound(new { error = "Account not found." });
            }

            // Prevent modification of main accounts (!IsMain means it's mutable)
            if (account.IsMain)
            {
                return BadRequest(new { error = "Main accounts cannot be modified." });
            }

            // Prevent changing IsMain to true if user already has a main account
            if (updateDto.IsMain && !account.IsMain)
            {
                var existingMainAccount = _repository.Find(a => a.UserId == updateDto.UserId && a.IsMain && a.Id != id);
                if (existingMainAccount != null)
                {
                    return BadRequest(new { error = "User already has a main account. Only one main account is allowed per user." });
                }
            }

            return UpdateEntity(updateDto, a => a.Id == id, entity =>
            {
                entity.UpdatedAt = DateTime.UtcNow;
            });
        }

        public (bool Success, string ErrorMessage) DeleteAllAccountsForUser(Guid userId)
        {
            // Get all non-deleted accounts for this user with all components
            var activeAccounts = _context.Accounts
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Where(a => a.UserId == userId && !a.IsDeleted)
                .ToList();

            if (activeAccounts.Count == 0)
                return (false, "No active accounts found for user.");

            // Soft delete all user accounts and their components
            foreach (var account in activeAccounts)
            {
                // Soft delete account components
                if (account.CoreDetails != null && !account.CoreDetails.IsDeleted)
                {
                    account.CoreDetails.IsDeleted = true;
                    account.CoreDetails.DeletedAt = DateTime.UtcNow;
                }

                if (account.ActiveAccount != null && !account.ActiveAccount.IsDeleted)
                {
                    account.ActiveAccount.IsDeleted = true;
                    account.ActiveAccount.DeletedAt = DateTime.UtcNow;
                }

                if (account.SpendingLimit != null)
                {
                    // SpendingLimit doesn't inherit from IDeletable, so we remove it
                    _context.Remove(account.SpendingLimit);
                }

                if (account.SavingGoal != null)
                {
                    // SavingGoal doesn't inherit from IDeletable, so we remove it
                    _context.Remove(account.SavingGoal);
                }

                // Soft delete the account itself
                account.IsDeleted = true;
                account.DeletedAt = DateTime.UtcNow;
                account.UpdatedAt = DateTime.UtcNow;
            }

            // Save changes
            _context.SaveChanges();

            return (true, string.Empty);
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteAccount(Guid id)
        {
            // Get the account with its core details to check balance
            var account = _context.Accounts
                .Include(a => a.CoreDetails)
                .Where(a => a.Id == id && !a.IsDeleted)
                .FirstOrDefault();

            if (account == null)
            {
                return NotFound(new { error = "Account not found or has already been deleted." });
            }

            // Prevent deletion of main accounts - they are permanent
            if (account.IsMain)
            {
                return BadRequest(new { error = "Main accounts cannot be deleted." });
            }

            // Check if account has zero balance
            if (account.CoreDetails != null && account.CoreDetails.Balance != 0)
            {
                return BadRequest(new { error = $"Account cannot be deleted because it has a non-zero balance of ${account.CoreDetails.Balance:F2}. Please transfer all funds before deleting the account." });
            }

            return RemoveEntity(a => a.Id == id);
        }
    }
}
