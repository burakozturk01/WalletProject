using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;
using Src.Entities;

namespace Src.Components
{
    public class CoreDetailsComponent : IBaseEntity
    {
        [Key]
        [ForeignKey("Account")]
        public Guid AccountId { get; set; }

        // IBaseEntity.Id implementation - using AccountId as the primary key
        public Guid Id 
        { 
            get => AccountId; 
            set => AccountId = value; 
        }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation property
        public virtual Account Account { get; set; } = null!;
    }
}
