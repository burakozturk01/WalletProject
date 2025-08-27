using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;
using Src.Components;

namespace Src.Entities
{
    public class Account : IBaseEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        [Required]
        public bool IsMain { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Transaction> SourceTransactions { get; set; } = new List<Transaction>();
        public virtual ICollection<Transaction> DestinationTransactions { get; set; } = new List<Transaction>();

        // Component relationships
        public virtual CoreDetailsComponent? CoreDetails { get; set; }
        public virtual ActiveAccountComponent? ActiveAccount { get; set; }
        public virtual SpendingLimitComponent? SpendingLimit { get; set; }
        public virtual SavingGoalComponent? SavingGoal { get; set; }
    }
}
