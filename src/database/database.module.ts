import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

export const NEO4J_DRIVER = 'NEO4J_DRIVER';

@Global()
@Module({
  providers: [
    {
      provide: NEO4J_DRIVER,
      useFactory: async (configService: ConfigService): Promise<Driver> => {
        const uri = configService.get<string>('NEO4J_URI');
        const username = configService.get<string>('NEO4J_USERNAME');
        const password = configService.get<string>('NEO4J_PASSWORD');

        const driver = neo4j.driver(
          uri,
          neo4j.auth.basic(username, password)
        );

        // Verify connectivity
        await driver.verifyConnectivity();
        console.log('Neo4j connection established successfully');

        return driver;
      },
      inject: [ConfigService],
    },
  ],
  exports: [NEO4J_DRIVER],
})
export class DatabaseModule {}
