import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";

const app = new Hono();

// Validation schemas
const createMealSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  nutritionInfo: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fats: z.number().optional(),
  }).optional(),
  cost: z.number().optional(),
  servingSize: z.string().optional(),
  prepTime: z.number().optional(), // minutes
  schoolId: z.string(),
});

const createMealPlanSchema = z.object({
  schoolId: z.string(),
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  meals: z.array(z.object({
    mealId: z.string(),
    dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
    date: z.string().optional(),
  })),
  notes: z.string().optional(),
});

// ============ MEALS ============

// POST /api/meals - Create new meal
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createMealSchema.parse(body);

    const meal = await db.meal.create({
      data: validated,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      meal,
    });
  } catch (error) {
    console.error("Error creating meal:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create meal" }, 500);
  }
});

// GET /api/meals - Get all meals
app.get("/", async (c) => {
  try {
    const { schoolId, mealType, search } = c.req.query();

    if (!schoolId) {
      return c.json({ success: false, error: "School ID is required" }, 400);
    }

    const where: any = { schoolId };
    if (mealType) where.mealType = mealType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const meals = await db.meal.findMany({
      where,
      orderBy: [
        { mealType: "asc" },
        { name: "asc" },
      ],
    });

    return c.json({
      success: true,
      meals,
      total: meals.length,
    });
  } catch (error) {
    console.error("Error fetching meals:", error);
    return c.json({ success: false, error: "Failed to fetch meals" }, 500);
  }
});

// GET /api/meals/:id - Get single meal
app.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const meal = await db.meal.findUnique({
      where: { id },
      include: {
        school: true,
        mealPlans: {
          include: {
            mealPlan: true,
          },
        },
      },
    });

    if (!meal) {
      return c.json({ success: false, error: "Meal not found" }, 404);
    }

    return c.json({
      success: true,
      meal,
    });
  } catch (error) {
    console.error("Error fetching meal:", error);
    return c.json({ success: false, error: "Failed to fetch meal" }, 500);
  }
});

// PUT /api/meals/:id - Update meal
app.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const meal = await db.meal.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        mealType: body.mealType,
        ingredients: body.ingredients,
        allergens: body.allergens,
        nutritionInfo: body.nutritionInfo,
        cost: body.cost,
        servingSize: body.servingSize,
        prepTime: body.prepTime,
      },
    });

    return c.json({
      success: true,
      meal,
    });
  } catch (error) {
    console.error("Error updating meal:", error);
    return c.json({ success: false, error: "Failed to update meal" }, 500);
  }
});

// DELETE /api/meals/:id - Delete meal
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    // Check if meal is used in any meal plans
    const mealPlans = await db.mealPlanMeal.count({
      where: { mealId: id },
    });

    if (mealPlans > 0) {
      return c.json(
        {
          success: false,
          error: `Cannot delete meal. It is used in ${mealPlans} meal plan(s)`,
        },
        400
      );
    }

    await db.meal.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meal:", error);
    return c.json({ success: false, error: "Failed to delete meal" }, 500);
  }
});

// ============ MEAL PLANS ============

// POST /api/meals/plans - Create meal plan
app.post("/plans", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createMealPlanSchema.parse(body);

    // Create meal plan
    const mealPlan = await db.mealPlan.create({
      data: {
        schoolId: validated.schoolId,
        name: validated.name,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        notes: validated.notes,
      },
    });

    // Create meal plan meals
    const mealPlanMeals = await Promise.all(
      validated.meals.map((meal) =>
        db.mealPlanMeal.create({
          data: {
            mealPlanId: mealPlan.id,
            mealId: meal.mealId,
            dayOfWeek: meal.dayOfWeek,
            mealType: meal.mealType,
            date: meal.date ? new Date(meal.date) : undefined,
          },
        })
      )
    );

    return c.json({
      success: true,
      mealPlan: {
        ...mealPlan,
        meals: mealPlanMeals,
      },
    });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create meal plan" }, 500);
  }
});

// GET /api/meals/plans - Get all meal plans
app.get("/plans", async (c) => {
  try {
    const { schoolId, active } = c.req.query();

    if (!schoolId) {
      return c.json({ success: false, error: "School ID is required" }, 400);
    }

    const where: any = { schoolId };

    // Filter active plans (current date within range)
    if (active === "true") {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const mealPlans = await db.mealPlan.findMany({
      where,
      include: {
        meals: {
          include: {
            meal: true,
          },
        },
        _count: {
          select: {
            meals: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return c.json({
      success: true,
      mealPlans,
      total: mealPlans.length,
    });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return c.json({ success: false, error: "Failed to fetch meal plans" }, 500);
  }
});

// GET /api/meals/plans/:id - Get single meal plan
app.get("/plans/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const mealPlan = await db.mealPlan.findUnique({
      where: { id },
      include: {
        school: true,
        meals: {
          include: {
            meal: true,
          },
          orderBy: [
            { dayOfWeek: "asc" },
            { mealType: "asc" },
          ],
        },
      },
    });

    if (!mealPlan) {
      return c.json({ success: false, error: "Meal plan not found" }, 404);
    }

    return c.json({
      success: true,
      mealPlan,
    });
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return c.json({ success: false, error: "Failed to fetch meal plan" }, 500);
  }
});

// PUT /api/meals/plans/:id - Update meal plan
app.put("/plans/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.notes !== undefined) updateData.notes = body.notes;

    const mealPlan = await db.mealPlan.update({
      where: { id },
      data: updateData,
    });

    return c.json({
      success: true,
      mealPlan,
    });
  } catch (error) {
    console.error("Error updating meal plan:", error);
    return c.json({ success: false, error: "Failed to update meal plan" }, 500);
  }
});

// DELETE /api/meals/plans/:id - Delete meal plan
app.delete("/plans/:id", async (c) => {
  try {
    const { id } = c.req.param();

    // Delete associated meal plan meals first
    await db.mealPlanMeal.deleteMany({
      where: { mealPlanId: id },
    });

    await db.mealPlan.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return c.json({ success: false, error: "Failed to delete meal plan" }, 500);
  }
});

// GET /api/meals/plans/current/:schoolId - Get current week's meal plan
app.get("/plans/current/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();

    const now = new Date();

    const mealPlan = await db.mealPlan.findFirst({
      where: {
        schoolId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        meals: {
          include: {
            meal: true,
          },
          orderBy: [
            { dayOfWeek: "asc" },
            { mealType: "asc" },
          ],
        },
      },
    });

    if (!mealPlan) {
      return c.json({
        success: true,
        mealPlan: null,
        message: "No active meal plan found",
      });
    }

    // Group meals by day
    const mealsByDay = {
      Monday: [] as any[],
      Tuesday: [] as any[],
      Wednesday: [] as any[],
      Thursday: [] as any[],
      Friday: [] as any[],
      Saturday: [] as any[],
      Sunday: [] as any[],
    };

    mealPlan.meals.forEach((planMeal: any) => {
      const dayOfWeek = planMeal.dayOfWeek as keyof typeof mealsByDay;
      mealsByDay[dayOfWeek].push({
        mealType: planMeal.mealType,
        meal: planMeal.meal,
      });
    });

    return c.json({
      success: true,
      mealPlan: {
        ...mealPlan,
        mealsByDay,
      },
    });
  } catch (error) {
    console.error("Error fetching current meal plan:", error);
    return c.json({ success: false, error: "Failed to fetch current meal plan" }, 500);
  }
});

// POST /api/meals/plans/:id/meals - Add meal to plan
app.post("/plans/:id/meals", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const mealPlanMeal = await db.mealPlanMeal.create({
      data: {
        mealPlanId: id,
        mealId: body.mealId,
        dayOfWeek: body.dayOfWeek,
        mealType: body.mealType,
        date: body.date ? new Date(body.date) : undefined,
      },
      include: {
        meal: true,
      },
    });

    return c.json({
      success: true,
      mealPlanMeal,
    });
  } catch (error) {
    console.error("Error adding meal to plan:", error);
    return c.json({ success: false, error: "Failed to add meal to plan" }, 500);
  }
});

// DELETE /api/meals/plans/meals/:mealPlanMealId - Remove meal from plan
app.delete("/plans/meals/:mealPlanMealId", async (c) => {
  try {
    const { mealPlanMealId } = c.req.param();

    await db.mealPlanMeal.delete({
      where: { id: mealPlanMealId },
    });

    return c.json({
      success: true,
      message: "Meal removed from plan successfully",
    });
  } catch (error) {
    console.error("Error removing meal from plan:", error);
    return c.json({ success: false, error: "Failed to remove meal from plan" }, 500);
  }
});

// GET /api/meals/statistics/:schoolId - Get meal statistics
app.get("/statistics/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();

    const meals = await db.meal.findMany({
      where: { schoolId },
      select: {
        mealType: true,
        cost: true,
        allergens: true,
      },
    });

    // Count by meal type
    const byMealType = meals.reduce((acc: any, meal: any) => {
      if (!acc[meal.mealType]) acc[meal.mealType] = 0;
      acc[meal.mealType]++;
      return acc;
    }, {});

    // Average cost
    const costsWithValue = meals.filter((m: any) => m.cost !== null);
    const avgCost =
      costsWithValue.reduce((sum: number, m: any) => sum + (m.cost || 0), 0) / costsWithValue.length || 0;

    // Common allergens
    const allergenCount: any = {};
    meals.forEach((meal: any) => {
      meal.allergens?.forEach((allergen: any) => {
        if (!allergenCount[allergen]) allergenCount[allergen] = 0;
        allergenCount[allergen]++;
      });
    });

    return c.json({
      success: true,
      statistics: {
        totalMeals: meals.length,
        byMealType,
        avgCost,
        commonAllergens: allergenCount,
      },
    });
  } catch (error) {
    console.error("Error fetching meal statistics:", error);
    return c.json({ success: false, error: "Failed to fetch meal statistics" }, 500);
  }
});

export default app;
