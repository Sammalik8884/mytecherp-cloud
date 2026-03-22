using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using MytechERP.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public  class FileService : IFileService
    {
        private readonly IWebHostEnvironment  _env;
        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }
        public async Task<string> SaveFileAsync(IFormFile file,string folderName)
        {
            if (file == null || file.Length == 0) {

                throw new Exception("File is empty");
            }
            var uploadsFolder = Path.Combine(_env.WebRootPath, folderName);
            if (Directory.Exists(uploadsFolder)) { 
            
            Directory.CreateDirectory(uploadsFolder);
            }
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath=Path.Combine(uploadsFolder, uniqueFileName);
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
               await file.CopyToAsync(fileStream);
            
            }

            return Path.Combine("/", folderName, uniqueFileName).Replace("\\", "/");


        }

    }
}
