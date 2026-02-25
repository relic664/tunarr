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

    test('maps jellyfin tags to categories', () => {
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
                  sourceType: 'jellyfin',
                  tags: [
                    {
                      tagId: 'tag-1',
                      programId: 'program-1',
                      groupingId: null,
                      tag: {
                        uuid: 'tag-1',
                        tag: 'Visible & Featured',
                      },
                    },
                    {
                      tagId: 'tag-2',
                      programId: 'program-1',
                      groupingId: null,
                      tag: {
                        uuid: 'tag-2',
                        tag: 'Visible & Featured',
                      },
                    },
                  ],
                }),
              },
            },
          ],
        },
      ]);

      expect(output.programmes[0].category).toEqual([
        { _value: 'Visible &amp; Featured' },
      ]);
    });
  });
});
