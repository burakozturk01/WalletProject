using System;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Src.Controllers;
using Src.Database;
using Src.Entities;

namespace Src.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly AppDbContext _context;

        public TransactionRepository(AppDbContext context)
        {
            _context = context;
        }

        public TransactionReadDTO ParseToRead(Transaction entity)
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
                SourceAccountBalanceBefore = entity.SourceAccountBalanceBefore,
                DestinationAccountBalanceBefore = entity.DestinationAccountBalanceBefore,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
            };
        }

        public IQueryable<Transaction> Get(out int count)
        {
            IQueryable<Transaction> entities = _context
                .Set<Transaction>()
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.CoreDetails)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.CoreDetails)
                .OrderByDescending(entity => entity.Timestamp);
            count = entities.Count();

            return entities;
        }

        public Transaction Find(Expression<Func<Transaction, bool>> predicate)
        {
            return _context
                .Set<Transaction>()
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.CoreDetails)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.CoreDetails)
                .FirstOrDefault(predicate);
        }

        public IQueryable<Transaction> Find(
            Expression<Func<Transaction, bool>> predicate,
            out int count
        )
        {
            IQueryable<Transaction> entities = _context
                .Set<Transaction>()
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.CoreDetails)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.CoreDetails)
                .OrderByDescending(entity => entity.Timestamp)
                .Where(predicate);

            count = entities.Count();

            return entities;
        }

        public Transaction GetOne(Guid id)
        {
            return _context
                .Set<Transaction>()
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.SourceAccount)
                .ThenInclude(a => a.CoreDetails)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.User)
                .Include(t => t.DestinationAccount)
                .ThenInclude(a => a.CoreDetails)
                .FirstOrDefault(t => t.Id == id);
        }

        public void Add(Transaction entity)
        {
            _context.Set<Transaction>().Add(entity);
        }

        public bool SaveChanges()
        {
            var rows = _context.SaveChanges();
            return (rows > 0);
        }
    }
}
