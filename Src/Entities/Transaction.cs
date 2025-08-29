using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;

namespace Src.Entities
{
    public enum SourceType
    {
        ACCOUNT,
        IBAN,
        SYSTEM,
    }

    public enum DestinationType
    {
        ACCOUNT,
        IBAN,
        SPEND,
    }

    public class Transaction
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public SourceType SourceType { get; set; }

        [ForeignKey("SourceAccount")]
        public Guid? SourceAccountId { get; set; }

        [MaxLength(34)]
        public string? SourceIban { get; set; }

        [MaxLength(255)]
        public string? SourceName { get; set; }

        [Required]
        public DestinationType DestinationType { get; set; }

        [ForeignKey("DestinationAccount")]
        public Guid? DestinationAccountId { get; set; }

        [MaxLength(34)]
        public string? DestinationIban { get; set; }

        [MaxLength(255)]
        public string? DestinationName { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime Timestamp { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? SourceAccountBalanceBefore { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? DestinationAccountBalanceBefore { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual Account? SourceAccount { get; set; }
        public virtual Account? DestinationAccount { get; set; }
    }
}
