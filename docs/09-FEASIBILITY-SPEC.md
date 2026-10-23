# Atexgrove — Feasibility Engine

## Purpose
Provide transparent, basic scenario calculations for development planning. This is a planning aid and not professional financial advice.

The current prototype is deterministic and scenario-based. It does not guarantee a financial outcome, valuation, planning approval, funding decision or construction result.

## Inputs
- Land area (sqm)
- Land cost
- Development type
- Construction cost
- Professional fees
- Infrastructure cost
- Finance cost
- Taxes/charges
- Marketing cost
- Contingency
- Expected revenue
- Currency

## Calculations
### Total development cost
Land cost + construction cost + professional fees + infrastructure + finance + taxes/charges + marketing + contingency

### Gross profit
Expected revenue - total development cost

### Margin
Gross profit / expected revenue × 100

### Break-even revenue
At minimum, total development cost.

## Calculation contract

- Record the user inputs, currency, units, assumptions and calculation version used for each scenario.
- Keep calculation rules explicit and deterministic; identical inputs and rule version should reproduce identical outputs.
- Validate numeric ranges, required fields and incompatible combinations before calculating.
- Preserve intermediate totals so a user or reviewer can explain how an output was produced.
- Compare scenarios side by side without silently changing their inputs.
- Show uncertainty, exclusions, demo-data labels and sensitivity where a value is estimated.
- Make scenario creation, update, comparison and review auditable when connected to a project.

External cost, market, regulatory or professional data is **Future**. If introduced, retain source, source type, jurisdiction, collection date, last-updated date, confidence and applicable assumptions alongside the imported value.

Long-running report generation or bulk scenario work may become an asynchronous/background job. AI may help explain a result in the future, but it must not silently alter authoritative calculation inputs or formulas; consequential conclusions require human/professional review.

## Planned professional review record

For Phase 2 / Slice 3 verification workflow or Phase 3 report review, staff may attach a minimal professional review record containing reviewer name, discipline, credential relied on, source and check date, assigned scope, and decision ([P-30](BACKLOG.md#p-30)). Label it “recorded by Atexgrove, not independently verified”; it is a staff-recorded description, not proof of current credentials, and requires no external professional login. No case documents may be shared outside the platform until the case-specific consent record and real-user readiness gate are in place ([P-32](BACKLOG.md#p-32)).

## Requirements
- Explain assumptions
- Round display values consistently
- Prevent negative or invalid numeric inputs
- Allow multiple scenarios per project
- Compare scenarios side by side
- Store scenario inputs and outputs for reproducibility
- Do not label estimates as official market data or guaranteed returns
- Keep failures and unavailable external inputs explicit rather than substituting invented values
