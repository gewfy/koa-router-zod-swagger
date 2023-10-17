import { ZodValidatorProps } from '../ZodValidator';
import { SwaggerResponseType } from '../Types';
import { DEFAULT_RESPONSES_CODES } from './Constants';
import statuses from 'statuses';
import zodToJsonSchema from 'zod-to-json-schema';

export const generateResponses = (
  props?: ZodValidatorProps,
): SwaggerResponseType => {
  const responseStatusCodes =
    props?.response?.possibleStatusCodes || DEFAULT_RESPONSES_CODES;
  const response = responseStatusCodes.reduce(
    (map: SwaggerResponseType, code) => {
      map[code] = { description: statuses(code) };
      return map;
    },
    {},
  );
  if (props?.response?.description) {
    response[responseStatusCodes[0]].description = props?.response?.description;
  }
  if (props?.response?.body) {
    response[responseStatusCodes[0]].content = {
      'application/json': {
        schema: zodToJsonSchema(props.response.body, { target: 'openApi3' }),
      },
    };
  }
  return response;
};
