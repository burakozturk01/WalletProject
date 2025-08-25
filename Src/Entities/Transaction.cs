using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;

namespace Src.Entities
{
    public enum SourceType
    {
        ACCOUNT,    // Transaction from an account
        IBAN,       // Transaction from an external IBAN
        SYSTEM      // System-generated transaction (e.g., interest, fees)
    }

    public enum DestinationType
    {
        ACCOUNT,    // Transaction to an account
        IBAN,       // Transaction to an external IBAN
        SPEND       // Spending transaction (no destination account)
    }

    public class Transaction : IBaseEntity
    {
        [Key]
        public Guid Id { get; set; }

        // Source information
        [Required]
        public SourceType SourceType { get; set; }

        [ForeignKey("SourceAccount")]
        public Guid? SourceAccountId { get; set; }

        [MaxLength(34)]
        public string? SourceIban { get; set; }

        [MaxLength(255)]
        public string? SourceName { get; set; }

        // Destination information
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

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public virtual Account? SourceAccount { get; set; }
        public virtual Account? DestinationAccount { get; set; }
    }
}
