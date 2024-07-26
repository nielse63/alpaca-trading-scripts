import { format } from 'date-fns';
import fs from 'fs-extra';
// import { STDOUT_LOG_FILE, STDERR_LOG_FILE } from './constants';

export const isNumeric = (value: unknown) => {
  if (typeof value != 'string') return false;
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

export const toDecimal = (value: number | string, points: number = 2) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return parseFloat(`${numericValue.toFixed(points)}`);
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

export const logToFile = (msg: string, filepath: string) => {
  if (!msg) return;
  fs.ensureFileSync(filepath);
  const content = fs.readFileSync(filepath, 'utf8');
  const newContent = `${content}\n${msg}`;
  fs.writeFileSync(filepath, newContent);
};

export const log = async (message?: any, ...optionalParams: any[]) => {
  if (process.env.NODE_ENV === 'test') return;
  const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  console.log(date, message, ...optionalParams);
  // logToFile(msg, STDOUT_LOG_FILE);
};

export const error = async (message?: any, ...optionalParams: any[]) => {
  if (process.env.NODE_ENV === 'test') return;
  const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  console.error(date, message, ...optionalParams);
  // logToFile(msg, STDERR_LOG_FILE);
};
