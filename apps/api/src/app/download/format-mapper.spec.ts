import { mapToYtDlpFormat, YtDlpFormatArgs } from './format-mapper';

describe('mapToYtDlpFormat', () => {
  describe('best + resolution', () => {
    it('1080p uses generic selector with height cap', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('best', '1080p');
      expect(result.format).toBe('bv*[height<=1080]+ba/b[height<=1080]');
      expect(result.extractAudio).toBe(false);
      expect(result.audioFormat).toBeNull();
    });

    it('2160p uses 2160 height cap', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('best', '2160p');
      expect(result.format).toBe('bv*[height<=2160]+ba/b[height<=2160]');
    });

    it('480p uses 480 height cap', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('best', '480p');
      expect(result.format).toBe('bv*[height<=480]+ba/b[height<=480]');
    });
  });

  describe('mp4 + resolution', () => {
    it('1080p prefers mp4 video + m4a audio with merge', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('mp4', '1080p');
      expect(result.format).toBe(
        'bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4][height<=1080]',
      );
      expect(result.extractAudio).toBe(false);
    });

    it('720p mp4 produces correct selector', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('mp4', '720p');
      expect(result.format).toBe(
        'bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]',
      );
    });
  });

  describe('audio-only formats', () => {
    it('mp3 selects bestaudio and extracts to mp3', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('mp3', 'audio');
      expect(result.format).toBe('bestaudio/best');
      expect(result.extractAudio).toBe(true);
      expect(result.audioFormat).toBe('mp3');
    });

    it('m4a selects bestaudio and extracts to m4a', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('m4a', 'audio');
      expect(result.format).toBe('bestaudio/best');
      expect(result.extractAudio).toBe(true);
      expect(result.audioFormat).toBe('m4a');
    });

    it('mp3 with resolution quality still extracts mp3 (quality ignored)', () => {
      const result: YtDlpFormatArgs = mapToYtDlpFormat('mp3', '1080p');
      expect(result.format).toBe('bestaudio/best');
      expect(result.extractAudio).toBe(true);
      expect(result.audioFormat).toBe('mp3');
    });
  });

  describe('validation', () => {
    it('rejects quality="audio" with video format', () => {
      expect(() => mapToYtDlpFormat('best', 'audio')).toThrow(
        /Quality 'audio' requires format/,
      );
      expect(() => mapToYtDlpFormat('mp4', 'audio')).toThrow();
    });
  });
});
