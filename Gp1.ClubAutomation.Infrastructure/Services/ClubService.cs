using Gp1.ClubAutomation.Application.DTOs.Club;
using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services
{
    public class ClubService : IClubService
    {
        private readonly AppDbContext _db;
        public ClubService(AppDbContext db) => _db = db;

        public async Task<List<ClubDto>> GetAllAsync()
        {
            var test = await _db.Clubs
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new ClubDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive
                })
                .ToListAsync();
            return test;
        }

        public async Task<ClubDto?> GetByIdAsync(int id)
        {
            return await _db.Clubs
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new ClubDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ClubDto> CreateAsync(CreateClubRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                throw new ArgumentException("Name is required.");

            var entity = new Domain.Entities.Club.Club
            {
                Name = req.Name.Trim(),
                Description = req.Description
            };

            _db.Clubs.Add(entity);
            await _db.SaveChangesAsync();

            return new ClubDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                IsActive = entity.IsActive
            };
        }

        public async Task<bool> ExistsAsync(int clubId)
        {
            return await _db.Clubs
                .AsNoTracking()
                .AnyAsync(c => c.Id == clubId);
        }
    }
}