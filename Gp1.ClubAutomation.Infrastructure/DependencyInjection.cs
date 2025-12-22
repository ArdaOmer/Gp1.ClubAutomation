using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Infrastructure.Context;
using Gp1.ClubAutomation.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Gp1.ClubAutomation.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IClubService, ClubService>();
            services.AddScoped<IEventService, EventService>();
            services.AddScoped<IAnnouncementService, AnnouncementService>();
            services.AddScoped<IAttendanceService, AttendanceService>();
            services.AddScoped<IUserService, UserService>();

            return services;
        }
    }
}