import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { ChevronRight, Home, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import ExampleSearch from "./ExampleSearch";

interface HeaderProps {
	currentPath?: string;
}

export default function Header({ currentPath = "/" }: HeaderProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [location, setLocation] = useState({ pathname: currentPath });

	useEffect(() => {
		// Update location when client-side navigation occurs
		setLocation({ pathname: window.location.pathname });

		// Listen for navigation changes
		const handleLocationChange = () => {
			setLocation({ pathname: window.location.pathname });
		};

		window.addEventListener('popstate', handleLocationChange);
		return () => window.removeEventListener('popstate', handleLocationChange);
	}, []);

	// Generate breadcrumbs using current path
	const generateBreadcrumbs = () => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		const breadcrumbs = [{ name: "Home", path: "/", icon: Home }];

		let currentPath = "";
		pathSegments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const name = segment
				.split("-")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");
			breadcrumbs.push({ name, path: currentPath });
		});

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();
	const isExamplesSection = location.pathname.startsWith("/examples");

	const navigationItems = [
		{
			name: "Examples",
			path: process.env.DEV !== "" ? "/play.ts/examples" : "/examples",
			description: "All interactive code examples",
		},
		{
			name: "Basic",
			path: process.env.DEV !== "" ? "/play.ts/examples/basic" : "/examples/basic",
			description: "Math, color, animation fundamentals",
		},
		{
			name: "Engineering",
			path: process.env.DEV !== "" ? "/play.ts/examples/engineering" : "/examples/engineering",
			description: "Advanced engineering simulations",
		},
		{
			name: "Visual",
			path: process.env.DEV !== "" ? "/play.ts/examples/visual" : "/examples/visual",
			description: "Graphics, physics, and creative coding",
		},
	];

	const isActivePath = (path: string) => {
		if (path === "/examples") {
			return location.pathname.startsWith("/examples");
		}
		return location.pathname.startsWith(path);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				{/* Main Navigation */}
				<div className="flex h-14 items-center justify-between">
					<div className="flex items-center space-x-8">
						{/* Logo/Brand */}
						<a
							href={process.env.DEV !== "" ? "/play.ts" : "/"}
							className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
						>
							<span>play.ts</span>
						</a>

						{/* Desktop Navigation using shadcn NavigationMenu */}
						<NavigationMenu className="hidden md:flex">
							<NavigationMenuList>
								{navigationItems.map((item) => (
									<NavigationMenuItem key={item.path}>
										<NavigationMenuLink asChild>
											<a
												href={item.path}
												className={cn(
													navigationMenuTriggerStyle(),
													isActivePath(item.path)
														? "bg-accent text-accent-foreground"
														: "text-muted-foreground",
													"relative z-20 pointer-events-auto",
												)}
											>
												{item.name}
											</a>
										</NavigationMenuLink>
									</NavigationMenuItem>
								))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>

					{/* Search and Mobile Menu */}
					<div className="flex items-center gap-4">
						{/* Search Component */}
						<ExampleSearch />

						{/* Mobile menu button */}
						<button
							type="button"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						>
							{isMobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{/* Breadcrumbs using shadcn Breadcrumb - Show only for examples */}
				{isExamplesSection && (
					<div className="pb-3">
						<Breadcrumb>
							<BreadcrumbList>
								{breadcrumbs.map((crumb, index) => (
									<div key={crumb.path} className="flex items-center">
										<BreadcrumbItem>
											{index === breadcrumbs.length - 1 ? (
												<BreadcrumbPage className="flex items-center gap-1">
													{crumb.icon && <crumb.icon className="h-4 w-4" />}
													{crumb.name}
												</BreadcrumbPage>
											) : (
												<BreadcrumbLink asChild>
													<a
														href={process.env.DEV !== "" ? `/play.ts${crumb.path}` : crumb.path}
														className="flex items-center gap-1 transition-colors hover:text-foreground"
													>
														{crumb.icon && <crumb.icon className="h-4 w-4" />}
														{crumb.name}
													</a>
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
										{index < breadcrumbs.length - 1 && (
											<BreadcrumbSeparator>
												<ChevronRight className="h-4 w-4" />
											</BreadcrumbSeparator>
										)}
									</div>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				)}

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t pb-4 pt-4">
						<nav className="grid gap-2">
							{navigationItems.map((item) => (
								<a
									key={item.path}
									href={item.path}
									onClick={() => setIsMobileMenuOpen(false)}
									className={cn(
										"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
										isActivePath(item.path)
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
									)}
								>
									<span>{item.name}</span>
									<span className="text-xs text-muted-foreground">
										{item.description}
									</span>
								</a>
							))}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
