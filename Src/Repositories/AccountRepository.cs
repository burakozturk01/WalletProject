using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Src.Controllers;
using Src.Database;
using Src.Entities;
using Src.Shared.Repository;

namespace Src.Repositories
{
    public class AccountRepository : Repository<Account, AccountReadDTO>
    {
        public AccountRepository(AppDbContext context) : base(context)
        {
        }

        public override AccountReadDTO ParseToRead(Account entity)
        {
            return new AccountReadDTO
            {
                Id = entity.Id,
                UserId = entity.UserId,
                IsMain = entity.IsMain,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                IsDeleted = entity.IsDeleted,
                DeletedAt = entity.DeletedAt,
                CoreDetails = entity.CoreDetails != null ? new CoreDetailsReadDTO
                {
                    Name = entity.CoreDetails.Name,
                    Balance = entity.CoreDetails.Balance
                } : null,
                ActiveAccount = entity.ActiveAccount != null ? new ActiveAccountReadDTO
                {
                    IBAN = entity.ActiveAccount.IBAN,
                    ActivatedAt = entity.ActiveAccount.ActivatedAt
                } : null,
                SpendingLimit = entity.SpendingLimit != null ? new SpendingLimitReadDTO
                {
                    LimitAmount = entity.SpendingLimit.LimitAmount,
                    Timeframe = entity.SpendingLimit.Timeframe,
                    CurrentSpending = entity.SpendingLimit.CurrentSpending,
                    PeriodStartDate = entity.SpendingLimit.PeriodStartDate
                } : null,
                SavingGoal = entity.SavingGoal != null ? new SavingGoalReadDTO
                {
                    GoalName = entity.SavingGoal.GoalName,
                    TargetAmount = entity.SavingGoal.TargetAmount
                } : null
            };
        }

        public override IQueryable<Account> Get(out int count)
        {
            IQueryable<Account> entities = _context.Set<Account>()
                .Include(a => a.User) 
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Include(a => a.SourceTransactions)
                .Include(a => a.DestinationTransactions)
                .Where(a => !a.IsDeleted) 
                .OrderBy(entity => entity.CreatedAt);
            count = entities.Count();

            return entities;
        }

        public override Account Find(System.Linq.Expressions.Expression<Func<Account, bool>> predicate)
        {
            return _context.Set<Account>()
                .Include(a => a.User) 
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Include(a => a.SourceTransactions)
                .Include(a => a.DestinationTransactions)
                .Where(a => !a.IsDeleted) 
                .FirstOrDefault(predicate);
        }

        public override IQueryable<Account> Find(System.Linq.Expressions.Expression<Func<Account, bool>> predicate, out int count)
        {
            IQueryable<Account> entities = _context.Set<Account>()
                .Include(a => a.User) 
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Include(a => a.SourceTransactions)
                .Include(a => a.DestinationTransactions)
                .Where(a => !a.IsDeleted) 
                .Where(predicate)
                .OrderBy(entity => entity.CreatedAt);
                
            count = entities.Count();

            return entities;
        }

                public IQueryable<Account> GetAll(out int count)
        {
            IQueryable<Account> entities = _context.Set<Account>()
                .IgnoreQueryFilters() 
                .Include(a => a.User) 
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Include(a => a.SourceTransactions)
                .Include(a => a.DestinationTransactions)
                .OrderBy(entity => entity.CreatedAt);
            count = entities.Count();

            return entities;
        }

        public Account FindAll(System.Linq.Expressions.Expression<Func<Account, bool>> predicate)
        {
            return _context.Set<Account>()
                .IgnoreQueryFilters() 
                .Include(a => a.User) 
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Include(a => a.SourceTransactions)
                .Include(a => a.DestinationTransactions)
                .FirstOrDefault(predicate);
        }

        public IQueryable<Account> FindAll(System.Linq.Expressions.Expression<Func<Account, bool>> predicate, out int count)
        {
            IQueryable<Account> entities = _context.Set<Account>()
                .IgnoreQueryFilters() 
                .Include(a => a.User) 
                .Include(a => a.CoreDetails)
                .Include(a => a.ActiveAccount)
                .Include(a => a.SpendingLimit)
                .Include(a => a.SavingGoal)
                .Include(a => a.SourceTransactions)
                .Include(a => a.DestinationTransactions)
                .Where(predicate)
                .OrderBy(entity => entity.CreatedAt);
                
            count = entities.Count();

            return entities;
        }
    }
}
