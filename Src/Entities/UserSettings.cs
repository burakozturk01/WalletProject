using System;
using System.ComponentModel.DataAnnotations;
using Src.Database;

namespace Src.Entities
{
    public class UserSettings
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string SettingsJson { get; set; } = "{}";

        // Navigation property
        public virtual User User { get; set; } = null!;
    }
}
