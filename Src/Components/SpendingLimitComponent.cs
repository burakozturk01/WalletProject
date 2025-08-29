using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;
using Src.Entities;

namespace Src.Components
{
    public enum LimitTimeframe
    {
        DAILY,
        WEEKLY,
        MONTHLY,
        YEARLY
    }

    public class SpendingLimitComponent : IDeletableComponent
    {
        [Key]
        [ForeignKey("Account")]
        public Guid AccountId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal LimitAmount { get; set; }

        [Required]
        public LimitTimeframe Timeframe { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CurrentSpending { get; set; } = 0;

        [Required]
        public DateTime PeriodStartDate { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual Account Account { get; set; } = null!;
    }
}
