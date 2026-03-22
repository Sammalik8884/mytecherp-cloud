using MytechERP.domain.Entities;
using System.Linq.Expressions;
using System.Collections.Generic;

namespace MyTechERP.API.Helpers
{
    public static class ProductSearchHelper
    {
        public static Expression<Func<Product, bool>> GetSearchExpression(string searchText)
        {
            if (string.IsNullOrWhiteSpace(searchText)) return x => true;

            var terms = searchText.Trim().ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var parameter = Expression.Parameter(typeof(Product), "x");

            Expression? finalExpression = null;

            foreach (var term in terms)
            {
                // 1. Create Variations (Smart Plural Handling)
                // If user types "Sprinklers", we search for "Sprinklers" OR "Sprinkler"
                var variations = new List<string> { term };

                if (term.EndsWith("s") && term.Length > 3) // Check length to avoid stripping "gas", "bus"
                {
                    variations.Add(term.Substring(0, term.Length - 1)); // Add singular version
                }

                // 2. Build the OR Block for this specific term (and its variations) across all columns
                Expression? termBlock = null;

                var properties = new[] { "Name", "Description", "Brand", "ItemCode", "SupplierItemCode", "TechnicalSpecs" };

                foreach (var variation in variations)
                {
                    var constant = Expression.Constant(variation);

                    foreach (var propName in properties)
                    {
                        var property = Expression.Property(parameter, propName);

                        // Safety Checks
                        var notNull = Expression.NotEqual(property, Expression.Constant(null));
                        var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes);
                        var toLowerCall = Expression.Call(property, toLowerMethod!);
                        var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) });
                        var containsCall = Expression.Call(toLowerCall, containsMethod!, constant);

                        var safeCheck = Expression.AndAlso(notNull, containsCall);

                       
                        termBlock = termBlock == null ? safeCheck : Expression.OrElse(termBlock, safeCheck);
                    }
                }

              
                finalExpression = finalExpression == null ? termBlock : Expression.AndAlso(finalExpression, termBlock!);
            }

            return Expression.Lambda<Func<Product, bool>>(finalExpression!, parameter);
        }
    }
}