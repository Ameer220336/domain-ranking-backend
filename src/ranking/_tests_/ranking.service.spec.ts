import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from '../ranking.service';

// Mock pg Pool
const mockPool = {
  connect: jest.fn(),
  end: jest.fn(),
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

describe('RankingService', () => {
  let service: RankingService;

  beforeEach(async () => {
    // Mock environment variables
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'test';
    process.env.TRANCO_API_BASE = 'https://tranco-list.eu/api/ranks/domain';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: 'DB_POOL',
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);

    // Mock the pool connection
    mockPool.connect.mockResolvedValue(mockClient);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a new ranking record', async () => {
      const mockResult = {
        rows: [{
          id: 'test-uuid',
          domain: 'google.com',
          rank: 5,
          date: '2025-12-01',
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      mockClient.query.mockResolvedValue(mockResult);

      const result = await service.create('google.com', 5, '2025-12-01');

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rankings'),
        ['google.com', 5, '2025-12-01']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('fetchRank', () => {
    it('should return cached results when found and recent', async () => {
      const cachedRows = [
        {
          domain: 'google.com',
          rank: 5,
          date: '2025-12-01',
          updatedAt: new Date(), // recent
        },
      ];

      mockClient.query.mockResolvedValue({ rows: cachedRows });

      const result = await service.fetchRank('google.com');

      expect(result).toEqual({
        domain: 'google.com',
        labels: ['2025-12-01'],
        ranks: [5],
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT domain, rank, date'),
        ['google.com']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should fetch from Tranco API when cache is stale', async () => {
      // Mock stale cache
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 2); // 2 days ago

      const cachedRows = [
        {
          domain: 'google.com',
          rank: 5,
          date: '2025-12-01',
          updatedAt: staleDate, // stale
        },
      ];

      const trancoResponse = {
        ranks: [
          { date: '2025-12-26', rank: 3 },
          { date: '2025-12-27', rank: 2 },
        ],
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: cachedRows }) // cache query
        .mockResolvedValueOnce({ rows: [] }) // delete query
        .mockResolvedValueOnce({ rows: [] }); // insert query

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(trancoResponse),
      });

      const result = await service.fetchRank('google.com');

      expect(result).toEqual({
        domain: 'google.com',
        labels: ['2025-12-26', '2025-12-27'],
        ranks: [3, 2],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://tranco-list.eu/api/ranks/domain/google.com'
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should fetch from Tranco API when no cache exists', async () => {
      const trancoResponse = {
        ranks: [
          { date: '2025-12-26', rank: 3 },
          { date: '2025-12-27', rank: 2 },
        ],
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // no cache
        .mockResolvedValueOnce({ rows: [] }) // delete query
        .mockResolvedValueOnce({ rows: [] }); // insert query

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(trancoResponse),
      });

      const result = await service.fetchRank('google.com');

      expect(result).toEqual({
        domain: 'google.com',
        labels: ['2025-12-26', '2025-12-27'],
        ranks: [3, 2],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://tranco-list.eu/api/ranks/domain/google.com'
      );
    });

    it('should handle API errors gracefully', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // no cache

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(service.fetchRank('nonexistent.com')).rejects.toThrow(
        'Tranco API request failed: 404 Not Found'
      );
    });

    it('should handle invalid API responses', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // no cache

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      await expect(service.fetchRank('google.com')).rejects.toThrow(
        'Invalid response from Tranco API - missing or invalid ranks array'
      );
    });
  });
});