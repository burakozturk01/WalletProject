using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Src.Database;

namespace Src.Entities
{
    public class User : IBaseEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(64)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();
        public virtual UserSettings? Settings { get; set; }
    }
}
