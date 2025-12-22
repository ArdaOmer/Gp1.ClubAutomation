namespace Gp1.ClubAutomation.Application.Interfaces;

public interface IAuthService
{
    Task<object?> LoginAsync(string email, string password);
}