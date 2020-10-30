/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import type {AggregatedResult} from '@jest/test-result';
import type {Context, CoverageReporterOptions} from './types';
import BaseReporter from './BaseReporter';

const NEW_LINE = '%0A';
const REGEXP_LINE_COL = /:([0-9]+):([0-9]+)/;

export default class GitHubActionsReporter extends BaseReporter {
  private _globalConfig: Config.GlobalConfig;
  private _options: CoverageReporterOptions;

  constructor(
    globalConfig: Config.GlobalConfig,
    options?: CoverageReporterOptions,
  ) {
    super();
    this._globalConfig = globalConfig;
    this._options = options || {};
  }

  async onRunComplete(
    contexts: Set<Context>,
    aggregatedResults: AggregatedResult,
  ): Promise<void> {
    this._printMessages(aggregatedResults, this._globalConfig);
  }

  private _printMessages(
    aggregatedResults: AggregatedResult,
    globalConfig: Config.GlobalConfig,
  ) {
    const failedTests = aggregatedResults.numFailedTests;
    const runtimeErrors = aggregatedResults.numRuntimeErrorTestSuites;

    if (failedTests + runtimeErrors > 0) {
      aggregatedResults.testResults.forEach(testResultItem => {
        const testFilePath = testResultItem.testFilePath;

        testResultItem.testResults.forEach(result => {
          if (result.status !== 'failed') {
            return;
          }

          result.failureMessages.forEach(failureMessage => {
            const message = failureMessage.replace(/\n/g, NEW_LINE);
            const captureGroup = message.match(REGEXP_LINE_COL);

            if (!captureGroup) {
              this.log('Unable to extract line number from call stack');
              return;
            }

            const [, line, col] = captureGroup;
            this.log(
              `::error file=${testFilePath},line=${line},col=${col}::${message}`,
            );
          });
        });
      });
    }
  }
}
