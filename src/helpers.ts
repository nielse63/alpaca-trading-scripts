export const isNumeric = (value: unknown) => {
  if (typeof value != 'string') return false;
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

export const parseResponseObject = (object = {}): any => {
  return Object.entries(object).reduce(
    (previousValue, [key, value]) => {
      const newValue =
        typeof value === 'string' && isNumeric(value)
          ? parseFloat(value)
          : value;
      return {
        ...previousValue,
        [key]: newValue,
      };
    },
    { ...object }
  );
};

export const generatorToArray = async (resp: AsyncGenerator): Promise<any> => {
  const result = [];
  for await (const x of resp) {
    result.push(x);
  }
  return result;
};
