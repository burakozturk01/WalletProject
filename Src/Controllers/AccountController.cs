using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Src.Components;
using Src.Database;
using Src.Entities;
using Src.Repositories;
using Src.Services;
using Src.Shared.Controller;
using Src.Shared.DTO;
using Src.Shared.Repository;

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

        [Required]
        public CoreDetailsCreateDTO CoreDetails { get; set; } = new();

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
        private readonly ITimezoneService _timezoneService;

        public AccountController(
            IRepository<Account, AccountReadDTO> repository,
            AppDbContext context,
            ITimezoneService timezoneService
        )
            : base(repository)
        {
            _context = context;
            _timezoneService = timezoneService;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return null;
            }
            return userId;
        }

        private async Task<AccountReadDTO> ConvertToUserTimezone(AccountReadDTO dto, Guid userId)
        {
            dto.CreatedAt = await _timezoneService.ConvertToUserTimezoneAsync(
                userId,
                dto.CreatedAt
            );
            dto.UpdatedAt = await _timezoneService.ConvertToUserTimezoneAsync(
                userId,
                dto.UpdatedAt
            );
            if (dto.DeletedAt.HasValue)
            {
                dto.DeletedAt = await _timezoneService.ConvertToUserTimezoneAsync(
                    userId,
                    dto.DeletedAt.Value
                );
            }
            if (dto.ActiveAccount != null)
            {
                dto.ActiveAccount.ActivatedAt = await _timezoneService.ConvertToUserTimezoneAsync(
                    userId,
                    dto.ActiveAccount.ActivatedAt
                );
            }
            if (dto.SpendingLimit != null)
            {
                dto.SpendingLimit.PeriodStartDate =
                    await _timezoneService.ConvertToUserTimezoneAsync(
                        userId,
                        dto.SpendingLimit.PeriodStartDate
                    );
            }
            return dto;
        }

        [HttpGet]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAccounts(
            [FromQuery] PaginateDTO paginate
        )
        {
            return GetEntities(paginate);
        }

        [HttpGet("{id}")]
        public ActionResult<AccountReadDTO> GetAccount(Guid id)
        {
            return FindEntity(a => a.Id == id);
        }

        [HttpGet("user/{userId}")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAccountsByUser(
            Guid userId,
            [FromQuery] PaginateDTO paginate
        )
        {
            return FindEntities(paginate, a => a.UserId == userId);
        }

        [HttpGet("user/{userId}/all")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAllAccountsByUserIncludingDeleted(
            Guid userId,
            [FromQuery] PaginateDTO paginate
        )
        {
            var accountRepository = _repository as AccountRepository;
            if (accountRepository != null)
            {
                var accounts = accountRepository
                    .FindAll(a => a.UserId == userId, out int total)
                    .Skip(paginate.Skip)
                    .Take(paginate.Limit)
                    .ToList();

                var data = accounts.Select(accountRepository.ParseToRead);
                return Ok(new ListReadDTO<AccountReadDTO> { Data = data, Total = total });
            }
            return FindEntities(paginate, a => a.UserId == userId);
        }

        [HttpGet("admin/all")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAllAccounts(
            [FromQuery] PaginateDTO paginate
        )
        {
            var accountRepository = _repository as AccountRepository;
            if (accountRepository != null)
            {
                var accounts = accountRepository
                    .GetAll(out int total)
                    .Skip(paginate.Skip)
                    .Take(paginate.Limit)
                    .ToList();

                var data = accounts.Select(accountRepository.ParseToRead);
                return Ok(new ListReadDTO<AccountReadDTO> { Data = data, Total = total });
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
                if (account == null)
                    return NotFound();
                return Ok(accountRepository.ParseToRead(account));
            }
            return FindEntity(a => a.Id == id);
        }

        [HttpGet("admin/user/{userId}")]
        public ActionResult<ListReadDTO<AccountReadDTO>> GetAllAccountsByUser(
            Guid userId,
            [FromQuery] PaginateDTO paginate
        )
        {
            var accountRepository = _repository as AccountRepository;
            if (accountRepository != null)
            {
                var accounts = accountRepository
                    .FindAll(a => a.UserId == userId, out int total)
                    .Skip(paginate.Skip)
                    .Take(paginate.Limit)
                    .ToList();

                var data = accounts.Select(accountRepository.ParseToRead);
                return Ok(new ListReadDTO<AccountReadDTO> { Data = data, Total = total });
            }
            return FindEntities(paginate, a => a.UserId == userId);
        }

        [HttpPost]
        public ActionResult<AccountReadDTO> CreateAccount([FromBody] AccountCreateDTO createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userExists = _context.Users.Any(u => u.Id == createDto.UserId && !u.IsDeleted);
                if (!userExists)
                {
                    return BadRequest("Invalid user ID. The specified user does not exist.");
                }

                if (createDto.IsMain)
                {
                    var existingMainAccount = _repository.Find(a =>
                        a.UserId == createDto.UserId && a.IsMain
                    );
                    if (existingMainAccount != null)
                    {
                        return BadRequest(
                            new
                            {
                                error = "User already has a main account. Only one main account is allowed per user.",
                            }
                        );
                    }
                }

                var account = new Account
                {
                    Id = Guid.NewGuid(),
                    UserId = createDto.UserId,
                    IsMain = createDto.IsMain,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false,
                };

                account.CoreDetails = new CoreDetailsComponent
                {
                    Id = Guid.NewGuid(),
                    AccountId = account.Id,
                    Name = createDto.CoreDetails.Name,
                    Balance = createDto.CoreDetails.Balance,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false,
                };

                if (createDto.ActiveAccount != null)
                {
                    account.ActiveAccount = new ActiveAccountComponent
                    {
                        AccountId = account.Id,
                        IBAN = createDto.ActiveAccount.IBAN,
                        ActivatedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        IsDeleted = false,
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
                        PeriodStartDate =
                            createDto.SpendingLimit.PeriodStartDate ?? DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
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
                        UpdatedAt = DateTime.UtcNow,
                    };
                }

                return CreateEntity(account);
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains("FOREIGN KEY constraint failed")
                    || ex.InnerException?.Message.Contains("FOREIGN KEY constraint failed") == true
                )
                    return BadRequest("Invalid user ID. The specified user does not exist.");

                return BadRequest($"An error occurred while creating the account: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public ActionResult<AccountReadDTO> UpdateAccount(
            Guid id,
            [FromBody] AccountCreateDTO updateDto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var account = _repository.Find(a => a.Id == id);
            if (account == null)
            {
                return NotFound(new { error = "Account not found." });
            }

            if (account.IsMain)
            {
                return BadRequest(new { error = "Main accounts cannot be modified." });
            }

            if (updateDto.IsMain && !account.IsMain)
            {
                var existingMainAccount = _repository.Find(a =>
                    a.UserId == updateDto.UserId && a.IsMain && a.Id != id
                );
                if (existingMainAccount != null)
                {
                    return BadRequest(
                        new
                        {
                            error = "User already has a main account. Only one main account is allowed per user.",
                        }
                    );
                }
            }

            return UpdateEntity(
                updateDto,
                a => a.Id == id,
                entity =>
                {
                    entity.UpdatedAt = DateTime.UtcNow;
                }
            );
        }

        public (bool Success, string ErrorMessage) DeleteAllAccountsForUser(Guid userId)
        {
            var activeAccounts = _context
                .Accounts.Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Where(a => a.UserId == userId && !a.IsDeleted)
                .ToList();

            if (activeAccounts.Count == 0)
                return (false, "No active accounts found for user.");

            foreach (var account in activeAccounts)
            {
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
                    _context.Remove(account.SpendingLimit);

                if (account.SavingGoal != null)
                    _context.Remove(account.SavingGoal);

                account.IsDeleted = true;
                account.DeletedAt = DateTime.UtcNow;
                account.UpdatedAt = DateTime.UtcNow;
            }

            _context.SaveChanges();

            return (true, string.Empty);
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteAccount(Guid id)
        {
            var account = _context
                .Accounts.Include(a => a.CoreDetails)
                .Where(a => a.Id == id && !a.IsDeleted)
                .FirstOrDefault();

            if (account == null)
                return NotFound(new { error = "Account not found or has already been deleted." });

            if (account.IsMain)
                return BadRequest(new { error = "Main accounts cannot be deleted." });

            if (account.CoreDetails != null && account.CoreDetails.Balance != 0)
                return BadRequest(
                    new
                    {
                        error = $"Account cannot be deleted because it has a non-zero balance of ${account.CoreDetails.Balance:F2}. Please transfer all funds before deleting the account.",
                    }
                );

            return RemoveEntity(a => a.Id == id);
        }
    }
}
