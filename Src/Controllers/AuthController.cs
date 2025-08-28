using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Src.Entities;
using Src.Components;
using Src.Repositories;
using Src.Database;
using System.ComponentModel.DataAnnotations;

namespace Src.Controllers
{
    public class LoginDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDTO
    {
        [Required]
        [MaxLength(64)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDTO
    {
        public string Token { get; set; } = string.Empty;
        public UserAuthDTO User { get; set; } = new UserAuthDTO();
        public DateTime ExpiresAt { get; set; }
    }

    public class UserAuthDTO
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserRepository _userRepository;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(UserRepository userRepository, AppDbContext context, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public ActionResult<AuthResponseDTO> Login([FromBody] LoginDTO loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Find user by email
                var user = _userRepository.FindAll(u => u.Email == loginDto.Email);
                if (user == null)
                {
                    return BadRequest("Invalid email or password");
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    return BadRequest("Invalid email or password");
                }

                // Generate JWT token
                var token = GenerateJwtToken(user);
                var expiresAt = DateTime.UtcNow.AddHours(24); // 24 hour expiration

                var response = new AuthResponseDTO
                {
                    Token = token,
                    User = new UserAuthDTO
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Email = user.Email
                    },
                    ExpiresAt = expiresAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest($"Login failed: {ex.Message}");
            }
        }

        [HttpPost("register")]
        public ActionResult<AuthResponseDTO> Register([FromBody] RegisterDTO registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using var dbTransaction = _context.Database.BeginTransaction();
            try
            {
                // Check if username already exists
                var existingUserByUsername = _userRepository.FindAll(u => u.Username == registerDto.Username);
                if (existingUserByUsername != null)
                {
                    return BadRequest("Username already exists. Please choose a different username.");
                }

                // Check if email already exists
                var existingUserByEmail = _userRepository.FindAll(u => u.Email == registerDto.Email);
                if (existingUserByEmail != null)
                {
                    return BadRequest("Email already exists. Please use a different email address.");
                }

                // Create new user
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = registerDto.Username,
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                // Create default main account for the user
                var defaultAccount = new Account
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    IsMain = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                // Create core details for the main account
                defaultAccount.CoreDetails = new CoreDetailsComponent
                {
                    Id = Guid.NewGuid(),
                    AccountId = defaultAccount.Id,
                    Name = "Main Account",
                    Balance = 0.00m,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                // Add the default account to the user
                user.Accounts.Add(defaultAccount);

                // Save user and account to database
                _userRepository.Add(user);
                _userRepository.SaveChanges();

                // Commit the transaction
                dbTransaction.Commit();

                // Generate JWT token
                var token = GenerateJwtToken(user);
                var expiresAt = DateTime.UtcNow.AddHours(24); // 24 hour expiration

                var response = new AuthResponseDTO
                {
                    Token = token,
                    User = new UserAuthDTO
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Email = user.Email
                    },
                    ExpiresAt = expiresAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                dbTransaction.Rollback();
                
                if (ex.Message.Contains("UNIQUE constraint failed") || ex.InnerException?.Message.Contains("UNIQUE constraint failed") == true)
                {
                    return BadRequest("Username or email already exists. Please use different values.");
                }
                
                return BadRequest($"Registration failed: {ex.Message}");
            }
        }

        [HttpPost("validate")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public ActionResult<UserAuthDTO> ValidateToken()
        {
            try
            {
                // Get user ID from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized("Invalid token");
                }

                // Find user in database
                var user = _userRepository.Find(u => u.Id == userId);
                if (user == null)
                {
                    return Unauthorized("User not found");
                }

                var userDto = new UserAuthDTO
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return Unauthorized($"Token validation failed: {ex.Message}");
            }
        }

        private string GenerateJwtToken(User user)
        {
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? "your-super-secret-key-that-should-be-at-least-32-characters-long";
            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "WalletProject";
            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "WalletProject";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
