using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;
using Src.Entities;

namespace Src.Components
{
    public class SavingGoalComponent : IDeletableComponent
    {
        [Key]
        [ForeignKey("Account")]
        public Guid AccountId { get; set; }

        [Required]
        [MaxLength(200)]
        public string GoalName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TargetAmount { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

                public virtual Account Account { get; set; } = null!;
    }
}
