import type {
  ExtendableContext,
  Context,
  Middleware,
  DefaultState,
  Next,
  Request,
} from 'koa';
import { AnyZodObject, TypeOf, ZodEffects, ZodSchema } from 'zod';
import { FileRequestObjectType } from './Types';

export type ZodValidatorProps = Props<
  AnyZodObject | ZodEffects<AnyZodObject>,
  AnyZodObject | ZodEffects<AnyZodObject>,
  AnyZodObject | ZodEffects<AnyZodObject>,
  ZodSchema,
  FileRequestObjectType,
  AnyZodObject | ZodEffects<AnyZodObject>,
  ZodSchema
>;
interface Props<
  TParams extends AnyZodObject | ZodEffects<AnyZodObject>,
  TQuery extends AnyZodObject | ZodEffects<AnyZodObject>,
  THeader extends AnyZodObject | ZodEffects<AnyZodObject>,
  TBody extends ZodSchema,
  TFiles extends FileRequestObjectType,
  TFilesValidator extends AnyZodObject | ZodEffects<AnyZodObject>,
  TResponse extends ZodSchema,
> {
  summary?: string;
  description?: string;
  query?: TQuery;
  params?: TParams;
  header?: THeader;
  body?: TBody;
  files?: TFiles;
  filesValidator?: TFilesValidator;
  response?: ResponseType<TResponse>;
}

interface ValidatedRequest<
  TQuery extends ZodSchema,
  THeader extends ZodSchema,
  TBody extends ZodSchema,
  TFilesValidator extends ZodSchema,
> extends Request {
  query: TypeOf<TQuery>;
  header: TypeOf<THeader>;
  body: TypeOf<TBody>;
  files: TypeOf<TFilesValidator>;
}

interface ValidatedContext<
  TParams extends ZodSchema,
  TQuery extends ZodSchema,
  THeader extends ZodSchema,
  TBody extends ZodSchema,
  TFilesValidator extends ZodSchema,
  TResponse extends ZodSchema,
> extends ExtendableContext {
  request: ValidatedRequest<TQuery, THeader, TBody, TFilesValidator>;
  params: TypeOf<TParams>;
  body: TypeOf<TResponse>;
}

type ResponseType<TResponse extends ZodSchema> = {
  description?: string;
  validate?: boolean;
  possibleStatusCodes?: number[];
  body: TResponse;
};

export const ZodValidator = <
  TParams extends AnyZodObject | ZodEffects<AnyZodObject>,
  TQuery extends AnyZodObject | ZodEffects<AnyZodObject>,
  THeader extends AnyZodObject | ZodEffects<AnyZodObject>,
  TBody extends ZodSchema,
  TFiles extends FileRequestObjectType,
  TFilesValidator extends AnyZodObject | ZodEffects<AnyZodObject>,
  TResponse extends ZodSchema,
>(
  props: Props<
    TParams,
    TQuery,
    THeader,
    TBody,
    TFiles,
    TFilesValidator,
    TResponse
  >,
): Middleware<
  DefaultState,
  ValidatedContext<TParams, TQuery, THeader, TBody, TFilesValidator, TResponse>
> => {
  const _ValidatorMiddleware = async (ctx: Context, next: Next) => {
    if (props.query && 'query' in ctx.request) {
      const query = props.query.parse(ctx.request.query);

      // Overwrites the query in the prototype so it's not stringified
      Object.defineProperty(ctx.request, 'query', {
        value: query,
        writable: false,
      });
    }
    if (props.params && 'params' in ctx) {
      ctx.params = props.params.parse(ctx.params);
    }
    if (props.header) {
      const header = props.header.parse(ctx.request.header);

      Object.defineProperty(ctx.request, 'header', {
        value: header,
        writable: false,
      });
    }
    if (props.body && 'body' in ctx.request) {
      ctx.request.body = props.body.parse(ctx.request.body);
    }
    if (props.filesValidator && 'files' in ctx.request) {
      ctx.request.files = props.filesValidator.parse(ctx.request.files);
    }

    await next();

    if (props.response?.validate && ctx.status === 200 && ctx.body) {
      ctx.body = props.response.body.parse(ctx.body);
    }
  };
  _ValidatorMiddleware._VALIDATOR_PROPS = props;
  return _ValidatorMiddleware;
};
