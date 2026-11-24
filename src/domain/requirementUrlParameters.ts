import products from '../../requirements/global/products.json';

export function requirementUrlContract(parameter: string) {
  const contract = products.catalog.urlParameters.find(row => row.parameter === parameter);
  if (!contract) throw new Error(`Missing fresh-start URL contract: ${parameter}`);
  return contract;
}

/** Allowed values come from the same global URL contract shown in the Library. */
export function requirementUrlValues(parameter: string): string[] {
  const contract = requirementUrlContract(parameter);
  return products.catalog.urlParameterValues.filter(row => row.urlParameterKey === contract.key).map(row => row.value);
}
