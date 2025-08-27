using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Src.Controllers;
using Src.Database;
using Src.Entities;
using Src.Shared.Repository;

namespace Src.Repositories
{
    public class TransactionRepository : Repository<Transaction, TransactionReadDTO>
    {
        public TransactionRepository(AppDbContext context) : base(context)
        {
        }

        public override TransactionReadDTO ParseToRead(Transaction entity)
        {
            return new TransactionReadDTO
            {
                Id = entity.Id,
                SourceType = entity.SourceType,
                SourceAccountId = entity.SourceAccountId,
                SourceIban = entity.SourceIban,
                SourceName = entity.SourceName,
                DestinationType = entity.DestinationType,
                DestinationAccountId = entity.DestinationAccountId,
                DestinationIban = entity.DestinationIban,
                DestinationName = entity.DestinationName,
                Amount = entity.Amount,
                Description = entity.Description,
                Timestamp = entity.Timestamp,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                IsDeleted = entity.IsDeleted,
                DeletedAt = entity.DeletedAt
            };
        }

        public override IQueryable<Transaction> Get(out int count)
        {
            IQueryable<Transaction> entities = _context.Set<Transaction>()
                .Include(t => t.SourceAccount)
                .Include(t => t.DestinationAccount)
                .OrderByDescending(entity => entity.Timestamp);
            count = entities.Count();

            return entities;
        }

        public override Transaction Find(System.Linq.Expressions.Expression<Func<Transaction, bool>> predicate)
        {
            return _context.Set<Transaction>()
                .Include(t => t.SourceAccount)
                .Include(t => t.DestinationAccount)
                .FirstOrDefault(predicate);
        }

        public override IQueryable<Transaction> Find(System.Linq.Expressions.Expression<Func<Transaction, bool>> predicate, out int count)
        {
            IQueryable<Transaction> entities = _context.Set<Transaction>()
                .Include(t => t.SourceAccount)
                .Include(t => t.DestinationAccount)
                .OrderByDescending(entity => entity.Timestamp)
                .Where(predicate);
                
            count = entities.Count();

            return entities;
        }
    }
}
