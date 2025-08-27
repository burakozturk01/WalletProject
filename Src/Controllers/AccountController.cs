using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Src.Entities;
using Src.Components;
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
        public AccountController(IRepository<Account, AccountReadDTO> repository) : base(repository)
        {
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
                    return BadRequest("User already has a main account. Only one main account is allowed per user.");
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
                return NotFound("Account not found.");
            }

            // Prevent modification of main accounts (!IsMain means it's mutable)
            if (account.IsMain)
            {
                return BadRequest("Main accounts cannot be modified.");
            }

            // Prevent changing IsMain to true if user already has a main account
            if (updateDto.IsMain && !account.IsMain)
            {
                var existingMainAccount = _repository.Find(a => a.UserId == updateDto.UserId && a.IsMain && a.Id != id);
                if (existingMainAccount != null)
                {
                    return BadRequest("User already has a main account. Only one main account is allowed per user.");
                }
            }

            return UpdateEntity(updateDto, a => a.Id == id, entity =>
            {
                entity.UpdatedAt = DateTime.UtcNow;
            });
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteAccount(Guid id)
        {
            // Check if the account exists and if it's a main account
            var account = _repository.Find(a => a.Id == id);
            if (account == null)
            {
                return NotFound("Account not found.");
            }

            // Prevent deletion of main accounts (!IsMain means it's deletable)
            if (account.IsMain)
            {
                return BadRequest("Main accounts cannot be deleted.");
            }

            return RemoveEntity(a => a.Id == id);
        }
    }
}
