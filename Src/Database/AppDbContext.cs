using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Src.Entities;
using Src.Components;

namespace Src.Database
{
    public partial class AppDbContext : DbContext
    {
        public AppDbContext()
        { }

        public AppDbContext(DbContextOptions<AppDbContext> options): base(options)
        { }

        // Entities
        public DbSet<User> Users { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }

        // Components
        public DbSet<CoreDetailsComponent> CoreDetailsComponents { get; set; }
        public DbSet<ActiveAccountComponent> ActiveAccountComponents { get; set; }
        public DbSet<SpendingLimitComponent> SpendingLimitComponents { get; set; }
        public DbSet<SavingGoalComponent> SavingGoalComponents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure soft delete for entities that implement IBaseEntity
            modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Account>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Transaction>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<CoreDetailsComponent>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<ActiveAccountComponent>().HasQueryFilter(e => !e.IsDeleted);

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Account entity configuration
            modelBuilder.Entity<Account>(entity =>
            {
                entity.HasOne(a => a.User)
                    .WithMany(u => u.Accounts)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Transaction entity configuration
            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasOne(t => t.SourceAccount)
                    .WithMany(a => a.SourceTransactions)
                    .HasForeignKey(t => t.SourceAccountId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.DestinationAccount)
                    .WithMany(a => a.DestinationTransactions)
                    .HasForeignKey(t => t.DestinationAccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Component configurations with soft delete
            modelBuilder.Entity<CoreDetailsComponent>(entity =>
            {
                entity.HasOne(c => c.Account)
                    .WithOne(a => a.CoreDetails)
                    .HasForeignKey<CoreDetailsComponent>(c => c.AccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ActiveAccountComponent>(entity =>
            {
                entity.HasOne(c => c.Account)
                    .WithOne(a => a.ActiveAccount)
                    .HasForeignKey<ActiveAccountComponent>(c => c.AccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Component configurations with physical delete
            modelBuilder.Entity<SpendingLimitComponent>(entity =>
            {
                entity.HasOne(c => c.Account)
                    .WithOne(a => a.SpendingLimit)
                    .HasForeignKey<SpendingLimitComponent>(c => c.AccountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SavingGoalComponent>(entity =>
            {
                entity.HasOne(c => c.Account)
                    .WithOne(a => a.SavingGoal)
                    .HasForeignKey<SavingGoalComponent>(c => c.AccountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is IBaseEntity || e.Entity is IDeletableComponent);

            foreach (var entry in entries)
            {
                var now = DateTime.UtcNow;

                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity is IBaseEntity baseEntity)
                    {
                        baseEntity.CreatedAt = now;
                        baseEntity.UpdatedAt = now;
                    }
                    else if (entry.Entity is IDeletableComponent deletableComponent)
                    {
                        deletableComponent.CreatedAt = now;
                        deletableComponent.UpdatedAt = now;
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    if (entry.Entity is IBaseEntity baseEntity)
                    {
                        baseEntity.UpdatedAt = now;
                    }
                    else if (entry.Entity is IDeletableComponent deletableComponent)
                    {
                        deletableComponent.UpdatedAt = now;
                    }
                }
            }
        }
    }
}
