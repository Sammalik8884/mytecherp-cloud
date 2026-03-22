using MytechERP.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FluentValidation;
namespace MytechERP.Application.Validators
{
    public class CreateProductValidator : AbstractValidator<CreateProductDto>
    {
        public CreateProductValidator() {

            RuleFor(x => x.Name).NotEmpty().WithMessage("Product name is required").Length(0, 100).WithMessage("Name must be between 3 and 100 Characters");
            RuleFor(x => x.Price).GreaterThan(0).WithMessage("price must be greater than zero.");
        
        }
    }
}
