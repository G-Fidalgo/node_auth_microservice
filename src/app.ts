import dotenv from 'dotenv';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { createConnection } from 'typeorm';
import { root, schema } from '@auth-api/schema';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import Access from '@auth-entity/access';

dotenv.config();
createConnection()
  .then(async (connection) => {
    await Access.load();
    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    app.use(
      process.env.GRAPHQL_PATH!,
      graphqlHTTP((request, response, graphqlParams) => ({
        schema: schema,
        rootValue: root,
        graphiql: true,
        context: {
          req: request,
          res: response
        }
      }))
    );

    app.listen(parseInt(process.env.APP_PORT!));
    const link: string = `http://localhost:${process.env.APP_PORT!}${process.env.GRAPHQL_PATH}`;
    console.log(`Server started at url: ${link}`);
  })
  .catch((error) => console.log(error));
