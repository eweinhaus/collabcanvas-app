/**
 * Tests for Creative Object Planner
 */

import {
  buildCreativeObjectPlanningPrompt,
  parseCreativeObjectPlan,
  validateCreativeObjectPlan,
  createFallbackPlan,
} from '../creativeObjectPlanner';

describe('creativeObjectPlanner', () => {
  describe('buildCreativeObjectPlanningPrompt', () => {
    it('should build a valid planning prompt', () => {
      const prompt = buildCreativeObjectPlanningPrompt('dinosaur', 500, 400, 1.0);
      
      expect(prompt).toContain('dinosaur');
      expect(prompt).toContain('Center position: (500, 400)');
      expect(prompt).toContain('Scale factor: 1');
      expect(prompt).toContain('10-20 shapes');
      expect(prompt).toContain('rectangle');
      expect(prompt).toContain('circle');
      expect(prompt).toContain('triangle');
    });

    it('should include scale factor in prompt', () => {
      const prompt = buildCreativeObjectPlanningPrompt('bus', 300, 200, 1.5);
      expect(prompt).toContain('Scale factor: 1.5');
    });
  });

  describe('parseCreativeObjectPlan', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify({
        shapes: [
          { type: 'rectangle', x: 100, y: 100, width: 50, height: 50, fill: '#FF0000' },
        ],
      });

      const plan = parseCreativeObjectPlan(json);
      expect(plan).toHaveProperty('shapes');
      expect(plan.shapes).toHaveLength(1);
    });

    it('should handle markdown-wrapped JSON', () => {
      const json = '```json\n{"shapes":[{"type":"circle","x":100,"y":100,"radius":30,"fill":"#0000FF"}]}\n```';
      
      const plan = parseCreativeObjectPlan(json);
      expect(plan).toHaveProperty('shapes');
      expect(plan.shapes[0].type).toBe('circle');
    });

    it('should handle JSON with code blocks', () => {
      const json = '```\n{"shapes":[{"type":"triangle","x":200,"y":200,"width":50,"height":50,"fill":"#00FF00"}]}\n```';
      
      const plan = parseCreativeObjectPlan(json);
      expect(plan).toHaveProperty('shapes');
      expect(plan.shapes[0].type).toBe('triangle');
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseCreativeObjectPlan('not json')).toThrow();
      expect(() => parseCreativeObjectPlan('')).toThrow();
      expect(() => parseCreativeObjectPlan(null)).toThrow();
    });
  });

  describe('validateCreativeObjectPlan', () => {
    it('should validate a correct plan', () => {
      const plan = {
        shapes: [
          { type: 'rectangle', x: 100, y: 100, width: 50, height: 50, fill: '#FF0000' },
          { type: 'circle', x: 200, y: 200, radius: 30, fill: '#0000FF' },
          { type: 'triangle', x: 300, y: 300, width: 40, height: 40, fill: '#00FF00' },
          { type: 'rectangle', x: 400, y: 400, width: 60, height: 60, fill: '#FFFF00' },
          { type: 'circle', x: 500, y: 500, radius: 25, fill: '#FF00FF' },
          { type: 'rectangle', x: 100, y: 200, width: 50, height: 50, fill: '#00FFFF' },
          { type: 'circle', x: 200, y: 300, radius: 30, fill: '#FFA500' },
          { type: 'triangle', x: 300, y: 400, width: 40, height: 40, fill: '#800080' },
          { type: 'rectangle', x: 400, y: 500, width: 60, height: 60, fill: '#FFC0CB' },
          { type: 'circle', x: 500, y: 100, radius: 25, fill: '#A52A2A' },
        ],
      };

      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(true);
    });

    it('should reject plan with too few shapes', () => {
      const plan = {
        shapes: [
          { type: 'rectangle', x: 100, y: 100, width: 50, height: 50, fill: '#FF0000' },
          { type: 'circle', x: 200, y: 200, radius: 30, fill: '#0000FF' },
        ],
      };

      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too few shapes');
    });

    it('should reject plan with too many shapes', () => {
      const shapes = [];
      for (let i = 0; i < 25; i++) {
        shapes.push({ type: 'circle', x: i * 10, y: i * 10, radius: 20, fill: '#000000' });
      }

      const plan = { shapes };
      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too many shapes');
    });

    it('should reject plan with invalid shape type', () => {
      const plan = {
        shapes: Array(10).fill(null).map((_, i) => ({
          type: i === 5 ? 'invalid' : 'rectangle',
          x: i * 10,
          y: i * 10,
          width: 50,
          height: 50,
          fill: '#000000',
        })),
      };

      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject circle without radius', () => {
      const plan = {
        shapes: Array(10).fill(null).map((_, i) => ({
          type: 'circle',
          x: i * 10,
          y: i * 10,
          fill: '#000000',
          // Missing radius
        })),
      };

      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('radius');
    });

    it('should reject rectangle without width/height', () => {
      const plan = {
        shapes: Array(10).fill(null).map((_, i) => ({
          type: 'rectangle',
          x: i * 10,
          y: i * 10,
          fill: '#000000',
          // Missing width and height
        })),
      };

      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('width');
    });

    it('should reject plan without shapes array', () => {
      const plan = { notShapes: [] };
      const result = validateCreativeObjectPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('shapes array');
    });

    it('should reject null or undefined plan', () => {
      expect(validateCreativeObjectPlan(null).valid).toBe(false);
      expect(validateCreativeObjectPlan(undefined).valid).toBe(false);
    });
  });

  describe('createFallbackPlan', () => {
    it('should create a valid fallback plan', () => {
      const plan = createFallbackPlan('unknown', 500, 400, 1.0);
      
      expect(plan).toHaveProperty('shapes');
      expect(plan.shapes.length).toBeGreaterThanOrEqual(5);
      
      // Validate the fallback plan
      const validation = validateCreativeObjectPlan(plan);
      expect(validation.valid).toBe(true);
    });

    it('should respect scale factor', () => {
      const plan1 = createFallbackPlan('test', 500, 400, 1.0);
      const plan2 = createFallbackPlan('test', 500, 400, 2.0);
      
      // Check that dimensions are scaled
      const rect1 = plan1.shapes.find(s => s.type === 'rectangle');
      const rect2 = plan2.shapes.find(s => s.type === 'rectangle');
      
      expect(rect2.width).toBeGreaterThan(rect1.width);
      expect(rect2.height).toBeGreaterThan(rect1.height);
    });

    it('should center shapes around provided coordinates', () => {
      const centerX = 600;
      const centerY = 300;
      const plan = createFallbackPlan('test', centerX, centerY, 1.0);
      
      // At least one shape should be near the center
      const nearCenter = plan.shapes.some(s => 
        Math.abs(s.x - centerX) < 200 && Math.abs(s.y - centerY) < 200
      );
      expect(nearCenter).toBe(true);
    });
  });
});
