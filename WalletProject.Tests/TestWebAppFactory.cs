using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Src.Database;
using System;
using System.Linq;

namespace WalletProject.Tests
{
    public class TestWebAppFactory<TEntryPoint> : WebApplicationFactory<TEntryPoint> where TEntryPoint : class
    {
        private readonly string _databaseName;

        public TestWebAppFactory()
        {
            _databaseName = $"test_wallet_{Guid.NewGuid()}.db";
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                var descriptorsToRemove = services.Where(d => 
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    (d.ServiceType.IsGenericType && d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>))
                ).ToList();

                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseSqlite($"Data Source={_databaseName}");
                }, ServiceLifetime.Scoped);

                var sp = services.BuildServiceProvider();
                using (var scope = sp.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    
                    db.Database.EnsureDeleted();
                    db.Database.EnsureCreated();
                }
            });
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                try
                {
                    if (System.IO.File.Exists(_databaseName))
                    {
                        System.IO.File.Delete(_databaseName);
                    }
                }
                catch
                {
                    // Log error
                    Console.WriteLine("Failed to delete test database");
                }
            }
            base.Dispose(disposing);
        }
    }
}
