import { Request, Response, NextFunction } from "express";
import { changeSubscriptionPlan, createPlanVersion, createProductVersion, createSubscription, getSubscription, transitionSubscription } from "../services/billing.js";
import { reconcileSubscriptionLifecycle, scheduleSubscriptionCancellation, undoSubscriptionCancellation } from "../services/subscriptionLifecycle.js";
import { ChangeSubscriptionPlanSchema, CreatePlanVersionSchema, CreateProductVersionSchema, CreateSubscriptionSchema, ScheduleCancellationSchema, TransitionSubscriptionSchema } from "../validators/billingValidators.js";

export async function createProductVersionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = CreateProductVersionSchema.parse(req.body);
    const product = await createProductVersion(data, req.user!.userId, req.ip, req.get("user-agent"));
    res.status(201).json({ data: product });
  } catch (error) { next(error); }
}

export async function createPlanVersionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = CreatePlanVersionSchema.parse(req.body);
    const plan = await createPlanVersion(data, req.user!.userId, req.ip, req.get("user-agent"));
    res.status(201).json({ data: plan });
  } catch (error) { next(error); }
}

export async function createSubscriptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = CreateSubscriptionSchema.parse(req.body);
    const subscription = await createSubscription(data.schoolId, data.planId, req.user!.userId, data.startedAt, req.ip, req.get("user-agent"));
    res.status(201).json({ data: subscription });
  } catch (error) { next(error); }
}

export async function transitionSubscriptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { event } = TransitionSubscriptionSchema.parse(req.body);
    const subscription = await transitionSubscription(req.params.schoolId, event, req.user!.userId, req.ip, req.get("user-agent"));
    res.json({ data: subscription });
  } catch (error) { next(error); }
}

export async function changeSubscriptionPlanController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { planId } = ChangeSubscriptionPlanSchema.parse(req.body);
    const subscription = await changeSubscriptionPlan(req.params.schoolId, planId, req.user!.userId, req.ip, req.get("user-agent"));
    res.json({ data: subscription });
  } catch (error) { next(error); }
}

export async function getSubscriptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const subscription = await getSubscription(req.params.schoolId);
    if (!subscription) { res.status(404).json({ error: "Subscription not found" }); return; }
    res.json({ data: subscription });
  } catch (error) { next(error); }
}

export async function getSubscriptionLifecycleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await reconcileSubscriptionLifecycle(req.params.schoolId, "system");
    res.json({ data: result });
  } catch (error) { next(error); }
}

export async function scheduleSubscriptionCancellationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cancelAt } = ScheduleCancellationSchema.parse(req.body);
    const subscription = await scheduleSubscriptionCancellation(req.params.schoolId, req.user!.userId, cancelAt, req.ip, req.get("user-agent"));
    res.json({ data: subscription });
  } catch (error) { next(error); }
}

export async function undoSubscriptionCancellationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const subscription = await undoSubscriptionCancellation(req.params.schoolId, req.user!.userId, req.ip, req.get("user-agent"));
    res.json({ data: subscription });
  } catch (error) { next(error); }
}
