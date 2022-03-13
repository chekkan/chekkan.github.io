---
layout: post
title: Validation Chain as Monad
---

    public class CostAllocationByCarrierRefAndCarrierKeyValidator
            : CostAllocationValidator, ICostAllocationByCarrierRefAndCarrierKeyValidator
        {
            protected override IEnumerable<CostAllocationValidationResult> TryAllocateCosts(
                ILookup<string, CostInFromCarrier> costsMatchingMastersAndCarrierKeys,
                CostAllocationValidationResult validationResult, CostInvoice invoice)
            {
                var incomingCost = validationResult.IncomingCost;
                var matches = costsMatchingMastersAndCarrierKeys[incomingCost.MasterAirWaybill].ToList();
                if (matches.Any())
                {
                    var orderedByAlreadyInvoicedLast = matches.OrderBy(x => x.CostInvoice == null ? 0 : 1);
                    foreach (var routeLine in orderedByAlreadyInvoicedLast)
                    {
                        if (routeLine.CarrierKey == incomingCost.CarrierKey)
                        {
                            if (routeLine.CostInvoice != null)
                            {
                                var error = CostAllocationError.AlreadyHasCost(routeLine);
                                yield return CostAllocationValidationResult.Fail(error, incomingCost, routeLine);
                            }
                            else
                            {
                                yield return CostAllocationValidationResult.Success(routeLine, incomingCost);
                            }
                        }
                        else
                        {
                            var error = CostAllocationError.NoMatch();
                            yield return CostAllocationValidationResult.Fail(error, incomingCost);
                        }
                    }
                }
                else
                {
                    var error = CostAllocationError.NoMatch();
                    yield return CostAllocationValidationResult.Fail(error, incomingCost);
                }
            }
        }
    
        public interface ICostAllocationByCarrierRefAndCarrierKeyValidator : ICostAllocationValidator
        { }

    var matches = allocations
        .Select(alloc => CostAllocationValidationResult.Fail(CostAllocationError.NoMatch(), alloc))
        .SelectMany(result => result.SelectError(r => costAllocationByCarrierRefAndCarrierKeyValidator.Validate(r, costsMatchingCarrierRef)))
        .OrderBy(OrderBySuccessfulMatchesFirst)
        .SelectMany(result => result.SelectError(r => costAllocationByCarrierRefValidator.Validate(r, costsMatchingCarrierRef)))
        .SelectMany(result => result.SelectError(r => costAllocationByWaybillValidator.Validate(r, costsMatchingWaybills, invoice))).ToList();

