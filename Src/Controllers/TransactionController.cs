using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Src.Entities;
using Src.Shared.Controller;
using Src.Shared.DTO;
using Src.Shared.Repository;
using Src.Database;
using Src.Repositories;

namespace Src.Controllers
{
    public class TransactionReadDTO
    {
        public Guid Id { get; set; }
        public SourceType SourceType { get; set; }
        public Guid? SourceAccountId { get; set; }
        public string? SourceIban { get; set; }
        public string? SourceName { get; set; }
        public DestinationType DestinationType { get; set; }
        public Guid? DestinationAccountId { get; set; }
        public string? DestinationIban { get; set; }
        public string? DestinationName { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public decimal? SourceAccountBalanceBefore { get; set; }
        public decimal? DestinationAccountBalanceBefore { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class TransactionCreateDTO
    {
        [Required]
        public SourceType SourceType { get; set; }

        public Guid? SourceAccountId { get; set; }

        [MaxLength(34)]
        public string? SourceIban { get; set; }

        [MaxLength(255)]
        public string? SourceName { get; set; }

        [Required]
        public DestinationType DestinationType { get; set; }

        public Guid? DestinationAccountId { get; set; }

        [MaxLength(34)]
        public string? DestinationIban { get; set; }

        [MaxLength(255)]
        public string? DestinationName { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public DateTime? Timestamp { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class TransactionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITransactionRepository _repository;

        public TransactionController(ITransactionRepository repository, AppDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        [HttpGet]
        public ActionResult<ListReadDTO<TransactionReadDTO>> GetTransactions([FromQuery] PaginateDTO paginate)
        {
            var transactions = _repository.Get(out int totalCount);
            
            if (paginate.Skip > 0)
                transactions = transactions.Skip(paginate.Skip);
            
            if (paginate.Limit > 0)
                transactions = transactions.Take(paginate.Limit);

            var transactionDtos = transactions.Select(t => _repository.ParseToRead(t)).ToList();

            return Ok(new ListReadDTO<TransactionReadDTO>
            {
                Data = transactionDtos,
                Total = totalCount
            });
        }

        [HttpGet("{id}")]
        public ActionResult<TransactionReadDTO> GetTransaction(Guid id)
        {
            var transaction = _repository.Find(t => t.Id == id);
            if (transaction == null)
                return NotFound();

            return Ok(_repository.ParseToRead(transaction));
        }

        [HttpGet("account/{accountId}")]
        public ActionResult<ListReadDTO<TransactionReadDTO>> GetTransactionsByAccount(Guid accountId, [FromQuery] PaginateDTO paginate)
        {
            var transactions = _repository.Find(t => t.SourceAccountId == accountId || t.DestinationAccountId == accountId, out int totalCount);
            
            if (paginate.Skip > 0)
                transactions = transactions.Skip(paginate.Skip);
            
            if (paginate.Limit > 0)
                transactions = transactions.Take(paginate.Limit);

            var transactionDtos = transactions.Select(t => _repository.ParseToRead(t)).ToList();

            return Ok(new ListReadDTO<TransactionReadDTO>
            {
                Data = transactionDtos,
                Total = totalCount
            });
        }

        [HttpPost]
        public ActionResult<TransactionReadDTO> CreateTransaction([FromBody] TransactionCreateDTO createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate source requirements
            if (createDto.SourceType == SourceType.ACCOUNT && createDto.SourceAccountId == null)
                return BadRequest("SourceAccountId is required when SourceType is ACCOUNT");
            
            if (createDto.SourceType == SourceType.IBAN && string.IsNullOrEmpty(createDto.SourceIban))
                return BadRequest("SourceIban is required when SourceType is IBAN");

            // Validate destination requirements
            if (createDto.DestinationType == DestinationType.ACCOUNT && createDto.DestinationAccountId == null)
                return BadRequest("DestinationAccountId is required when DestinationType is ACCOUNT");
            
            if (createDto.DestinationType == DestinationType.IBAN && string.IsNullOrEmpty(createDto.DestinationIban))
                return BadRequest("DestinationIban is required when DestinationType is IBAN");

            // Validate amount
            if (createDto.Amount <= 0)
                return BadRequest("Transaction amount must be greater than zero");

            using var dbTransaction = _context.Database.BeginTransaction();
            try
            {
                Account? sourceAccount = null;
                Account? destinationAccount = null;

                // Get source account if applicable and validate balance
                if (createDto.SourceType == SourceType.ACCOUNT)
                {
                    sourceAccount = _context.Accounts
                        .Include(a => a.CoreDetails)
                        .Where(a => a.Id == createDto.SourceAccountId && !a.IsDeleted)
                        .FirstOrDefault();
                    
                    if (sourceAccount == null)
                        return BadRequest("Source account not found or has been deleted");
                    
                    if (sourceAccount.CoreDetails == null)
                        return BadRequest("Source account does not have core details configured");
                    
                    if (sourceAccount.CoreDetails.Balance < createDto.Amount)
                        return BadRequest($"Insufficient funds. Available balance: ${sourceAccount.CoreDetails.Balance:F2}, Required: ${createDto.Amount:F2}");
                }

                // Get destination account if applicable
                if (createDto.DestinationType == DestinationType.ACCOUNT)
                {
                    destinationAccount = _context.Accounts
                        .Include(a => a.CoreDetails)
                        .Where(a => a.Id == createDto.DestinationAccountId && !a.IsDeleted)
                        .FirstOrDefault();
                    
                    if (destinationAccount == null)
                        return BadRequest("Destination account not found or has been deleted");
                    
                    if (destinationAccount.CoreDetails == null)
                        return BadRequest("Destination account does not have core details configured");
                }

                // Prevent transfers to the same account
                if (sourceAccount != null && destinationAccount != null && sourceAccount.Id == destinationAccount.Id)
                    return BadRequest("Cannot transfer money to the same account");

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(),
                    SourceType = createDto.SourceType,
                    SourceAccountId = createDto.SourceAccountId,
                    SourceIban = createDto.SourceIban,
                    SourceName = createDto.SourceName,
                    DestinationType = createDto.DestinationType,
                    DestinationAccountId = createDto.DestinationAccountId,
                    DestinationIban = createDto.DestinationIban,
                    DestinationName = createDto.DestinationName,
                    Amount = createDto.Amount,
                    Description = createDto.Description,
                    Timestamp = createDto.Timestamp ?? DateTime.UtcNow,
                    // Store balance before the transaction
                    SourceAccountBalanceBefore = sourceAccount?.CoreDetails?.Balance,
                    DestinationAccountBalanceBefore = destinationAccount?.CoreDetails?.Balance,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Update account balances
                if (sourceAccount != null)
                {
                    sourceAccount.CoreDetails.Balance -= createDto.Amount;
                    sourceAccount.CoreDetails.UpdatedAt = DateTime.UtcNow;
                    sourceAccount.UpdatedAt = DateTime.UtcNow;
                }

                if (destinationAccount != null)
                {
                    destinationAccount.CoreDetails.Balance += createDto.Amount;
                    destinationAccount.CoreDetails.UpdatedAt = DateTime.UtcNow;
                    destinationAccount.UpdatedAt = DateTime.UtcNow;
                }

                // Save changes
                _context.Transactions.Add(transaction);
                _context.SaveChanges();
                dbTransaction.Commit();

                // Return the created transaction
                var createdTransaction = _context.Transactions
                    .Include(t => t.SourceAccount)
                        .ThenInclude(a => a.CoreDetails)
                    .Include(t => t.SourceAccount)
                        .ThenInclude(a => a.User) // Include deleted users for reference
                    .Include(t => t.DestinationAccount)
                        .ThenInclude(a => a.CoreDetails)
                    .Include(t => t.DestinationAccount)
                        .ThenInclude(a => a.User) // Include deleted users for reference
                    .Where(t => t.Id == transaction.Id)
                    .FirstOrDefault();

                if (createdTransaction == null)
                    return StatusCode(500, "Transaction was created but could not be retrieved");

                var readDto = new TransactionReadDTO
                {
                    Id = createdTransaction.Id,
                    SourceType = createdTransaction.SourceType,
                    SourceAccountId = createdTransaction.SourceAccountId,
                    SourceIban = createdTransaction.SourceIban,
                    SourceName = createdTransaction.SourceName,
                    DestinationType = createdTransaction.DestinationType,
                    DestinationAccountId = createdTransaction.DestinationAccountId,
                    DestinationIban = createdTransaction.DestinationIban,
                    DestinationName = createdTransaction.DestinationName,
                    Amount = createdTransaction.Amount,
                    Description = createdTransaction.Description,
                    Timestamp = createdTransaction.Timestamp,
                    SourceAccountBalanceBefore = createdTransaction.SourceAccountBalanceBefore,
                    DestinationAccountBalanceBefore = createdTransaction.DestinationAccountBalanceBefore,
                    CreatedAt = createdTransaction.CreatedAt,
                    UpdatedAt = createdTransaction.UpdatedAt
                };

                return Ok(readDto);
            }
            catch (Exception ex)
            {
                dbTransaction.Rollback();
                return StatusCode(500, $"An error occurred while processing the transaction: {ex.Message}");
            }
        }

    }
}
