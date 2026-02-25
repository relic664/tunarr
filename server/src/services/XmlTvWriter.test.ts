import {
  createChannel,
  createFakeProgram,
  createFakeProgramOrm,
} from '../testing/fakes/entityCreators.ts';
import {
  inMemorySettingsDB,
  setTestGlobalOptions,
} from '../testing/getFakeSettingsDb.ts';
import { MaterializedChannelPrograms, XmlTvWriter } from './XmlTvWriter.ts';

beforeAll(async () => {
  await setTestGlobalOptions();
});

describe('XmlTvWriter', () => {
  describe('television', () => {
    const channels: MaterializedChannelPrograms[] = [
      {
        channel: createChannel({
          number: 1,
        }),
        programs: [
          {
            programming: {
              type: 'program',
              program: createFakeProgram({
                summary: `The family's trip to Itchy & Scratchy Land takes an unexpected turn when high-tech robots malfunction and become violent.`,
              }),
            },
          },
        ],
      },
    ];

    test('escapes summaries', () => {
      const writer = new XmlTvWriter(inMemorySettingsDB());
      const output = writer.generateXmltv(channels);
      expect(output.programmes[0].desc?.[0]._value).includes('&amp;');
    });

    test('maps deduped jellyfin hierarchy tags to categories', () => {
      const writer = new XmlTvWriter(inMemorySettingsDB());
      const output = writer.generateXmltv([
        {
          channel: createChannel({
            number: 2,
          }),
          programs: [
            {
              programming: {
                type: 'program',
                program: createFakeProgramOrm({
                  type: 'episode',
                  sourceType: 'jellyfin',
                  tags: [
                    {
                      tagId: 'tag-program-1',
                      programId: 'program-1',
                      groupingId: null,
                      tag: {
                        uuid: 'tag-program-1',
                        tag: 'Shared Visibility',
                      },
                    },
                    {
                      tagId: 'tag-program-2',
                      programId: 'program-1',
                      groupingId: null,
                      tag: {
                        uuid: 'tag-program-2',
                        tag: 'Episode Specific',
                      },
                    },
                  ],
                  season: {
                    tags: [
                      {
                        tagId: 'tag-season-1',
                        programId: null,
                        groupingId: 'season-1',
                        tag: {
                          uuid: 'tag-season-1',
                          tag: 'Season Curated',
                        },
                      },
                      {
                        tagId: 'tag-season-2',
                        programId: null,
                        groupingId: 'season-1',
                        tag: {
                          uuid: 'tag-season-2',
                          tag: 'Shared Visibility',
                        },
                      },
                    ],
                  },
                  show: {
                    tags: [
                      {
                        tagId: 'tag-show-1',
                        programId: null,
                        groupingId: 'show-1',
                        tag: {
                          uuid: 'tag-show-1',
                          tag: 'Show & Featured',
                        },
                      },
                      {
                        tagId: 'tag-show-2',
                        programId: null,
                        groupingId: 'show-1',
                        tag: {
                          uuid: 'tag-show-2',
                          tag: 'Shared Visibility',
                        },
                      },
                    ],
                  },
                }),
              },
            },
          ],
        },
      ]);

      expect(output.programmes[0].category).toEqual([
        { _value: 'Shared Visibility' },
        { _value: 'Episode Specific' },
        { _value: 'Season Curated' },
        { _value: 'Show &amp; Featured' },
      ]);
    });
  });
});
