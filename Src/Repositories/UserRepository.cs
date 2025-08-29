using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Src.Controllers;
using Src.Database;
using Src.Entities;
using Src.Shared.Repository;

namespace Src.Repositories
{
    public class UserRepository : Repository<User, UserReadDTO>
    {
        public UserRepository(AppDbContext context)
            : base(context) { }

        public override UserReadDTO ParseToRead(User entity)
        {
            return new UserReadDTO
            {
                Id = entity.Id,
                Username = entity.Username,
                Email = entity.Email,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                IsDeleted = entity.IsDeleted,
                DeletedAt = entity.DeletedAt,
            };
        }

        public override IQueryable<User> Get(out int count)
        {
            IQueryable<User> entities = _context
                .Set<User>()
                .Include(u => u.Accounts)
                .Where(u => !u.IsDeleted)
                .OrderBy(entity => entity.CreatedAt);
            count = entities.Count();

            return entities;
        }

        public override User Find(System.Linq.Expressions.Expression<Func<User, bool>> predicate)
        {
            return _context
                .Set<User>()
                .Include(u => u.Accounts)
                .Where(u => !u.IsDeleted)
                .FirstOrDefault(predicate);
        }

        public override IQueryable<User> Find(
            System.Linq.Expressions.Expression<Func<User, bool>> predicate,
            out int count
        )
        {
            IQueryable<User> entities = _context
                .Set<User>()
                .Include(u => u.Accounts)
                .Where(u => !u.IsDeleted)
                .Where(predicate)
                .OrderBy(entity => entity.CreatedAt);

            count = entities.Count();

            return entities;
        }

        public IQueryable<User> GetAll(out int count)
        {
            IQueryable<User> entities = _context
                .Set<User>()
                .IgnoreQueryFilters()
                .Include(u => u.Accounts)
                .OrderBy(entity => entity.CreatedAt);
            count = entities.Count();

            return entities;
        }

        public User FindAll(System.Linq.Expressions.Expression<Func<User, bool>> predicate)
        {
            return _context
                .Set<User>()
                .IgnoreQueryFilters()
                .Include(u => u.Accounts)
                .FirstOrDefault(predicate);
        }

        public IQueryable<User> FindAll(
            System.Linq.Expressions.Expression<Func<User, bool>> predicate,
            out int count
        )
        {
            IQueryable<User> entities = _context
                .Set<User>()
                .IgnoreQueryFilters()
                .Include(u => u.Accounts)
                .Where(predicate)
                .OrderBy(entity => entity.CreatedAt);

            count = entities.Count();

            return entities;
        }
    }
}
