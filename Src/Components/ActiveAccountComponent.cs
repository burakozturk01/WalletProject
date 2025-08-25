using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Src.Database;
using Src.Entities;

namespace Src.Components
{
    public class ActiveAccountComponent : IBaseEntity
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
        [MaxLength(34)]
        public string IBAN { get; set; } = string.Empty;

        [Required]
        public DateTime ActivatedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation property
        public virtual Account Account { get; set; } = null!;

        // TODO: Define criteria for non-default accounts to be eligible for activation:
        public static bool MeetsActivationCriteria(Account account)
        {
            return true;
        }
    }
}
