using System;

namespace Src.Database
{
    public interface IDeletableComponent : IDeletable
    {
        Guid AccountId { get; set; }
        DateTime CreatedAt { get; set; }
        DateTime UpdatedAt { get; set; }
    }
}
