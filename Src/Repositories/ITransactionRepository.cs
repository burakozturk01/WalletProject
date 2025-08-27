using System;
using System.Linq;
using System.Linq.Expressions;
using Src.Controllers;
using Src.Entities;

namespace Src.Repositories
{
    public interface ITransactionRepository
    {
        TransactionReadDTO ParseToRead(Transaction entity);
        IQueryable<Transaction> Get(out int count);
        Transaction Find(Expression<Func<Transaction, bool>> predicate);
        IQueryable<Transaction> Find(Expression<Func<Transaction, bool>> predicate, out int count);
        Transaction GetOne(Guid id);
        void Add(Transaction entity);
        bool SaveChanges();
    }
}
